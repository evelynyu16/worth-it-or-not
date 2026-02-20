// src/routes/profiles.routes.js
const express = require("express");
const { ObjectId } = require("mongodb");

// This router is "pure": it needs db injected from app.js
function createProfilesRouter(db) {
  const router = express.Router();
  const profiles = db.collection("profiles");

  // CREATE
  router.post("/", async (req, res) => {
    try {
      const { nickname } = req.body;

      if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
        return res.status(400).json({ error: "nickname must be a string (min 2 chars)" });
      }

      const doc = {
        nickname: nickname.trim(),
        createdAt: new Date(),
      };

      const result = await profiles.insertOne(doc);
      return res.status(201).json({ _id: result.insertedId, ...doc });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // READ ALL
  router.get("/", async (req, res) => {
    try {
      const list = await profiles
        .find({}, { projection: { nickname: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .toArray();

      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // READ ONE
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

      const doc = await profiles.findOne(
        { _id: new ObjectId(id) },
        { projection: { nickname: 1, createdAt: 1 } }
      );

      if (!doc) return res.status(404).json({ error: "profile not found" });
      return res.json(doc);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // UPDATE
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nickname } = req.body;

      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });
      if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
        return res.status(400).json({ error: "nickname must be a string (min 2 chars)" });
      }

      const result = await profiles.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { nickname: nickname.trim() } },
        { returnDocument: "after", projection: { nickname: 1, createdAt: 1 } }
      );

      if (!result.value) return res.status(404).json({ error: "profile not found" });
      return res.json(result.value);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

      const result = await profiles.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0)
        return res.status(404).json({ error: "profile not found" });

      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createProfilesRouter };
