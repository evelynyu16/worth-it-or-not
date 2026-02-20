const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function createUploadRouter() {
  const router = express.Router();

  const uploadDir = path.join(__dirname, "../../uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir); 
    },

    filename: function (req, file, cb) {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);

      cb(null, unique + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  router.post("/", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = "/uploads/" + req.file.filename;

    res.json({ imageUrl });
  });

  return router;
}

module.exports = { createUploadRouter };