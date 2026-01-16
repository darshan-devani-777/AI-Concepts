const path = require("path");
const fs = require("fs");
const PptxGenJS = require("pptxgenjs");

async function generatePPT(slidesData) {
  const pptx = new PptxGenJS();

  slidesData.forEach((slide) => {
    const s = pptx.addSlide();

    s.addText(slide.title || "No Title", {
      x: 0.5, y: 0.3,
      fontSize: 24,
      bold: true,
      color: "000000",
    });

    s.addText(
      slide.points && slide.points.length ? slide.points.join("\n") : "No content provided",
      { x: 0.5, y: 1.5, fontSize: 16, color: "000000" }
    );
  });

  const dirPath = path.join(__dirname, "../../uploads/ppt");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `AI_PPT_${Date.now()}.pptx`);
  await pptx.writeFile({ fileName: filePath });

  return filePath;
}

module.exports = { generatePPT };
