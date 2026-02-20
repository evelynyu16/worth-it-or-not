// server/src/routes/posts.routes.js
const express = require("express");
const { ObjectId } = require("mongodb");

const ALLOWED_SENTIMENTS = ["worth", "not_worth", "meh"];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return n;
}

function createPostsRouter(db) {
  const router = express.Router();
  const posts = db.collection("posts");
  const profiles = db.collection("profiles");

  // CREATE post
  router.post("/", async (req, res) => {
    try {
      const {
        itemName,
        category,
        expectation,
        reality,
        sentiment,
        profileId,
        imageUrl,
      } = req.body;

      if (!isNonEmptyString(itemName)) {
        return res.status(400).json({ error: "itemName is required (string)" });
      }
      if (!isNonEmptyString(category)) {
        return res.status(400).json({ error: "category is required (string)" });
      }
      if (!isNonEmptyString(expectation)) {
        return res.status(400).json({ error: "expectation is required (string)" });
      }
      if (!isNonEmptyString(reality)) {
        return res.status(400).json({ error: "reality is required (string)" });
      }
      if (!ALLOWED_SENTIMENTS.includes(sentiment)) {
        return res
          .status(400)
          .json({ error: "sentiment must be: worth | not_worth | meh" });
      }
      if (!profileId || !ObjectId.isValid(profileId)) {
        return res
          .status(400)
          .json({ error: "profileId is required (valid ObjectId string)" });
      }

      const profileObjectId = new ObjectId(profileId);
      const profile = await profiles.findOne({ _id: profileObjectId });
      if (!profile) return res.status(404).json({ error: "profile not found" });

      if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
        return res.status(400).json({ error: "imageUrl must be a string" });
      }

      const doc = {
        itemName: itemName.trim(),
        category: category.trim(),
        expectation: expectation.trim(),
        reality: reality.trim(),
        sentiment,
        imageUrl: imageUrl || null,
        profileId: profileObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await posts.insertOne(doc);

      return res.status(201).json({
        _id: result.insertedId,
        ...doc,
        author: { _id: profile._id, nickname: profile.nickname },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * READ posts
   * Query:
   *   category (optional)
   *   profileId (optional)  -> for "My posts only"
   *   page (optional, default 1)
   *   pageSize (optional, default 12, max 50)
   *
   * Response:
   *   { items, page, pageSize, total, totalPages }
   */
  router.get("/", async (req, res) => {
  try {
    const category = req.query.category ? String(req.query.category).trim() : "";
    const profileId = req.query.profileId ? String(req.query.profileId).trim() : "";

    const page = parsePositiveInt(req.query.page, 1);
    let pageSize = parsePositiveInt(req.query.pageSize, 12);
    if (pageSize > 50) pageSize = 50;

    // helper: escape regex special chars
    function escapeRegex(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    const match = {};

    // ✅ category: 精确匹配但大小写不敏感 (Tech == tech == TECH)
    if (category) {
      match.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    if (profileId) {
      if (!ObjectId.isValid(profileId)) {
        return res.status(400).json({ error: "profileId must be a valid ObjectId" });
      }
      match.profileId = new ObjectId(profileId);
    }

    const total = await posts.countDocuments(match);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const skip = (safePage - 1) * pageSize;

    const items = await posts
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $lookup: {
            from: "profiles",
            localField: "profileId",
            foreignField: "_id",
            as: "profile",
          },
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            author: { _id: "$profile._id", nickname: "$profile.nickname" },
          },
        },
        { $project: { profile: 0 } },
      ])
      .toArray();

    return res.json({
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

  // READ single post by id
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

      const result = await posts
        .aggregate([
          { $match: { _id: new ObjectId(id) } },
          {
            $lookup: {
              from: "profiles",
              localField: "profileId",
              foreignField: "_id",
              as: "profile",
            },
          },
          { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              author: { _id: "$profile._id", nickname: "$profile.nickname" },
            },
          },
          { $project: { profile: 0 } },
        ])
        .toArray();

      if (result.length === 0) return res.status(404).json({ error: "post not found" });
      return res.json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // UPDATE post by id
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

      const { itemName, category, expectation, reality, sentiment, imageUrl } = req.body;

      const patch = {};

      if (itemName !== undefined) {
        if (!isNonEmptyString(itemName)) {
          return res.status(400).json({ error: "itemName must be a non-empty string" });
        }
        patch.itemName = itemName.trim();
      }

      if (category !== undefined) {
        if (!isNonEmptyString(category)) {
          return res.status(400).json({ error: "category must be a non-empty string" });
        }
        patch.category = category.trim();
      }

      if (expectation !== undefined) {
        if (!isNonEmptyString(expectation)) {
          return res
            .status(400)
            .json({ error: "expectation must be a non-empty string" });
        }
        patch.expectation = expectation.trim();
      }

      if (reality !== undefined) {
        if (!isNonEmptyString(reality)) {
          return res.status(400).json({ error: "reality must be a non-empty string" });
        }
        patch.reality = reality.trim();
      }

      if (sentiment !== undefined) {
        if (!ALLOWED_SENTIMENTS.includes(sentiment)) {
          return res
            .status(400)
            .json({ error: "sentiment must be: worth | not_worth | meh" });
        }
        patch.sentiment = sentiment;
      }

      if (imageUrl !== undefined) {
        if (imageUrl !== null && typeof imageUrl !== "string") {
          return res.status(400).json({ error: "imageUrl must be a string or null" });
        }
        patch.imageUrl = imageUrl || null;
      }

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: "no valid fields to update" });
      }

      patch.updatedAt = new Date();

      const result = await posts.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: patch },
        { returnDocument: "after" }
      );

      if (!result.value) return res.status(404).json({ error: "post not found" });
      return res.json(result.value);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE post by id
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

      const result = await posts.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "post not found" });
      }

      return res.json({ ok: true, deletedId: id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createPostsRouter };