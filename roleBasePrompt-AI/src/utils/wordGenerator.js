const { Document, Packer, Paragraph, HeadingLevel } = require("docx");
const fs = require("fs");
const path = require("path");

async function generateWord(slidesData) {
  const doc = new Document({
    sections: [{
      children: slidesData.flatMap(slide => [
        new Paragraph({
          text: slide.title,
          heading: HeadingLevel.HEADING_1,
        }),
        ...slide.points.map(p =>
          new Paragraph({ text: p, bullet: { level: 0 } })
        ),
      ]),
    }],
  });

  const buffer = await Packer.toBuffer(doc);

  const dirPath = path.join(__dirname, "../../uploads/docx");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `AI_DOC_${Date.now()}.docx`);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

module.exports = { generateWord };
