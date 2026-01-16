const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");

const { pptToPdf } = require("../utils/pptToPdf");
const { wordToPdf } = require("../utils/wordToPdf");
const { excelToPdf } = require("../utils/excelToPdf");

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ---------------- IP Helper ----------------
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

// ---------------- Main Route ----------------
router.post("/:type-to-pdf", upload.single("file"), async (req, res) => {
  const start = Date.now();
  const { type } = req.params;

  // -------- IP Logging (same as PDF route) --------
  const clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  const realIP =
    clientIP === "127.0.0.1" || clientIP === "::1"
      ? getLocalIP()
      : clientIP;

  console.log("🌐 Live New Request from IP:", realIP);
  console.log({
    ip: realIP,
    method: req.method,
    url: req.originalUrl,
    time: new Date().toISOString(),
  });

  console.log(`📥 File received for TYPE = ${type.toUpperCase()}`);

  if (!req.file) {
    console.log("❌ No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    let pdfPath;

    if (type === "ppt") pdfPath = await pptToPdf(req.file);
    else if (type === "word") pdfPath = await wordToPdf(req.file);
    else if (type === "excel") pdfPath = await excelToPdf(req.file);
    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const fileName = path.basename(pdfPath);
    const BASE_URL =
      process.env.PUBLIC_BASE_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    
    const publicUrl = `${BASE_URL}/pdf/${fileName}`;
    
    console.log({
      message: "✅ PDF generated",
      url: publicUrl,
      durationMs: Date.now() - start,
    });
    
    res.json({
      message: "✅ PDF generated",
      url: publicUrl,
    });
    
  } catch (err) {
    console.error("❌ Convert to PDF failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
