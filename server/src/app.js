// server/src/app.js
require("dotenv").config();

const express = require("express");
const path = require("path");

const { createUploadRouter } = require("./routes/upload.routes");
const { connectDb } = require("./db");
const { createProfilesRouter } = require("./routes/profiles.routes");
const { createPostsRouter } = require("./routes/posts.routes");

const app = express();
app.use(express.json());

// ✅ 1) uploads static FIRST (must be before SPA fallback)
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ✅ 2) API routes
app.get("/api/health", (req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function start() {
  const db = await connectDb(process.env.MONGO_URI);

  app.use("/api/profiles", createProfilesRouter(db));
  app.use("/api/posts", createPostsRouter(db));
  app.use("/api/upload", createUploadRouter());

  // ✅ 3) Frontend static
  const clientDir = path.join(__dirname, "../../client");
  app.use(express.static(clientDir));

  // ✅ 4) SPA fallback (IMPORTANT: exclude /api and /uploads)
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).send("Not found");
    }
    return res.sendFile(path.join(clientDir, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});