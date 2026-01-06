import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "http://127.0.0.1:6333",
});

const COLLECTION_NAME = "documents";
const DIMENSION = 384;
const SIMILARITY_THRESHOLD = 0.45;
const CONFIDENCE_GAP = 0.05;

export async function initVectorDB() {
  try {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: DIMENSION,
        distance: "Cosine",
      },
    });
    console.log("📦 Qdrant collection created");
  } catch {
    console.log("📦 Qdrant collection already exists");
  }
}

export async function addVector(id, vector, text) {
  await client.upsert(COLLECTION_NAME, {
    points: [
      {
        id: Number(id),
        vector: Array.from(vector),
        payload: { text, docId: Number(id) }
      }
    ]
  });
}

export async function searchVector(vector) {
  console.log("\n🔍 VECTOR SEARCH");

  const result = await client.search(COLLECTION_NAME, {
    vector: Array.from(vector),
    limit: 2,
  });

  if (!result.length) {
    console.log("  ↳ status: no_match");
    return null;
  }

  const best = result[0];
  const second = result[1];

  console.log("  ↳ best_score:", best.score.toFixed(2));
  if (second) console.log("  ↳ second_score:", second.score.toFixed(2));

  if (best.score < SIMILARITY_THRESHOLD) {
    console.log("  ↳ status: rejected (low similarity)");
    return null;
  }

  if (second && best.score - second.score < CONFIDENCE_GAP) {
    console.log("  ↳ status: rejected (low confidence gap)");
    return null;
  }

  console.log("  ↳ selected_docId:", best.id);
  console.log("  ↳ status: accepted");

  return {
    text: best.payload.text,
    docId: best.id,
    similarity: best.score
  };
}
