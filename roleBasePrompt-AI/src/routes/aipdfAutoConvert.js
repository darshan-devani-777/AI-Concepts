const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const os = require("os");

const { parsePdf } = require("../utils/pdfParser");
const { queryGroq } = require("../utils/groqClient");

const { generatePPT } = require("../utils/pptGenerator");
const { generateWord } = require("../utils/wordGenerator");
const { generateExcel } = require("../utils/excelGenerator");

const path = require("path");

// ----------------------- JSON extractor -----------------------
function extractJSON(text) {
  const match = text.match(/(\[.*\]|\{.*\})/s);
  if (!match) throw new Error("No JSON found in AI response");

  let rawJson = match[0];
  rawJson = rawJson.replace(/,\s*([\]}])/g, "$1");
  rawJson = rawJson.replace(/(\w+):/g, '"$1":');

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    throw new Error("Failed to parse JSON from AI response: " + err.message);
  }
}

// ----------------------- Fallbacks -----------------------
function smartFallbackSlides(pdfText) {
  const slides = [];
  const paragraphs = pdfText.split(/\n{2,}/).filter((p) => p.trim() !== "");

  paragraphs.forEach((para) => {
    const lines = para
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    for (let j = 0; j < lines.length; j += 5) {
      slides.push({
        title: `Slide ${slides.length + 1}`,
        points: lines.slice(j, j + 5),
      });
    }
  });

  if (slides.length === 0) {
    slides.push({ title: "Slide 1", points: ["No content available"] });
  }

  return slides;
}

function smartFallbackExcel(pdfText) {
  return pdfText
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line, i) => ({ Column1: `Row ${i + 1}`, Content: line }));
}

// ----------------------- Get Local IP -----------------------
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

// ----------------------- Main Route -----------------------
router.post("/pdf-to/:type", upload.single("pdf"), async (req, res) => {
  const start = Date.now();
  const { type } = req.params;

  // ----------------------- IP Logging -----------------------
  const clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const realIP =
    clientIP === "127.0.0.1" || clientIP === "::1" ? getLocalIP() : clientIP;

  console.log("🌐 Live New Request from IP:", realIP);
  console.log({
    ip: realIP,
    method: req.method,
    url: req.originalUrl,
    time: new Date().toISOString(),
  });

  console.log(`📥 PDF received for TYPE = ${type}`);

  if (!["ppt", "word", "excel"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    if (!req.file) {
      console.log("❌ No PDF file received");
      return res.status(400).json({
        error: "No PDF file uploaded. Use form-data key: pdf",
      });
    }

    const pdfText = await parsePdf(req.file.buffer);
    if (!pdfText || pdfText.trim() === "")
      throw new Error("PDF has no readable text");

    console.log("📄 PDF parsed");

    const MAX_INPUT_CHARS = 7000;
    const safeText =
      pdfText.length > MAX_INPUT_CHARS
        ? pdfText.slice(0, MAX_INPUT_CHARS)
        : pdfText;

    console.log("PDF total chars:", pdfText.length);
    console.log("PDF sent to Groq:", safeText.length);

    // ----------------------- AI Prompt -----------------------
    const prompt =
      type === "excel"
        ? `
Extract tabular data from PDF.
STRICT JSON ARRAY:
[
  { "Column1": "value", "Column2": "value" }
]
CONTENT:
${safeText}
`
        : `
Convert PDF content into slides.
STRICT JSON ARRAY:
[
  { "title": "Slide title", "points": ["point 1","point 2"] }
]
CONTENT:
${safeText}
`;

    const messages = [
      {
        role: "system",
        content: "You are a JSON generator. Output ONLY valid JSON.",
      },
      { role: "user", content: prompt },
    ];

    // ----------------------- AI / Fallback -----------------------
    let structuredData;
    try {
      const aiRes = await queryGroq(messages);
      const raw = aiRes.choices[0].message.content;
      structuredData = extractJSON(raw);
      console.log("🤖 AI structured data ready:", structuredData);
    } catch (err) {
      console.warn("⚠️ Groq JSON parse failed, using fallback:", err.message);
      structuredData =
        type === "excel"
          ? smartFallbackExcel(pdfText)
          : smartFallbackSlides(pdfText);
      console.log("🤖 Structured data from fallback ready:", structuredData);
    }

    // ----------------------- File Generation -----------------------
    let filePath;
    if (type === "ppt") filePath = await generatePPT(structuredData);
    if (type === "word") filePath = await generateWord(structuredData);
    if (type === "excel") filePath = await generateExcel(structuredData);

    const fileName = path.basename(filePath);
    
    const BASE_URL =
      process.env.PUBLIC_BASE_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    const url =
      type === "ppt"
        ? `${BASE_URL}/ppt/${fileName}`
        : type === "word"
        ? `${BASE_URL}/docx/${fileName}`
        : `${BASE_URL}/xlsx/${fileName}`;

    console.log({
      message: `✅ ${type.toUpperCase()} generated`,
      url,
      durationMs: Date.now() - start,
    });

    // ----------------------- Response -----------------------
    res.json({
      message: `✅ ${type.toUpperCase()} generated`,
      url,
    });
  } catch (err) {
    console.error("❌ Auto PDF convert error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
