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

  const embedder = await getExtractor();
  const output = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  console.log("  ↳ model: all-MiniLM-L6-v2");
  console.log("  ↳ vector_dim:", output.data.length);
  console.log("  ↳ status: done");

  return output.data;
}
