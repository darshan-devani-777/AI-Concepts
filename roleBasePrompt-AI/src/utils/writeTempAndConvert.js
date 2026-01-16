const fs = require("fs");
const path = require("path");
const officeToPdf = require("./officeToPdf");

module.exports = async function writeTempAndConvert(file) {
  const tempDir = path.join("uploads", "tmp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

  try {
    fs.writeFileSync(tempPath, file.buffer);

    const pdfPath = await officeToPdf(tempPath);

    return pdfPath;
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log("🧹 Temp file removed:", tempPath);
    }
  }
};
