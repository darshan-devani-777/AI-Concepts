const multer = require("multer");

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.includes("pdf")) return cb(new Error("Only PDF files allowed"));
    cb(null, true);
  },
});

module.exports = upload;
