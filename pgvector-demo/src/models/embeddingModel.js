import { pipeline } from "@xenova/transformers";

let extractor;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("🧠 Embedding model ready");
  }
  return extractor;
}

export async function createEmbedding(text) {
  console.log("\n🧠 EMBEDDING");
  console.log("↳ input_chars:", text.length);

  const start = Date.now();
  const embedder = await getExtractor();

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  console.log("↳ vector_dim:", output.data.length);
  console.log("↳ time_ms:", Date.now() - start);
  console.log("↳ status: success");

  return output.data;
}

