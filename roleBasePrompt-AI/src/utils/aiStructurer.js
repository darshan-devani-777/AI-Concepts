const { queryGroq } = require("./groqClient");

async function structurePdf(pdfText, type) {
  let prompt;

  if (type === "excel") {
    prompt = `
Extract tabular data.
STRICT JSON ARRAY:
[
  { "Column1": "value", "Column2": "value" }
]
CONTENT:
${pdfText}
`;
  } else {
    prompt = `
Convert content into structured slides.
STRICT JSON:
[
  { "title": "Title", "points": ["p1","p2"] }
]
CONTENT:
${pdfText}
`;
  }

  const messages = [
    { role: "system", content: "Output ONLY valid JSON." },
    { role: "user", content: prompt },
  ];

  const res = await queryGroq(messages);
  return JSON.parse(res.choices[0].message.content);
}

module.exports = { structurePdf };
