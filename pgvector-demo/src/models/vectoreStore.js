import { pool } from "../db/postgres.js";

function toPgVector(arr) {
  if (!arr || typeof arr.length !== "number" || arr.length === 0) {
    throw new Error("Embedding is empty or invalid");
  }
  return `[${Array.from(arr).join(",")}]`;
}

const SIMILARITY_THRESHOLD = 0.45;
const CONFIDENCE_GAP = 0.05;

export async function addVector(docId, embedding, text) {
  console.log("\n📦 VECTOR STORE");
  console.log("↳ action: upsert");
  console.log("↳ doc_id:", docId);
  console.log("↳ embedding_dim:", embedding.length);

  const start = Date.now();

  await pool.query(
    `
    INSERT INTO documents (doc_id, content, embedding)
    VALUES ($1, $2, $3::vector)
    ON CONFLICT (doc_id)
    DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding
    `,
    [docId, text, toPgVector(embedding)]
  );

  console.log("↳ time_ms:", Date.now() - start);
  console.log("↳ status: stored");
}

export async function searchVector(embedding) {
  console.log("\n🔍 VECTOR SEARCH");
  console.log("↳ query_dim:", embedding.length);
  console.log("↳ similarity_threshold:", SIMILARITY_THRESHOLD);
  console.log("↳ confidence_gap:", CONFIDENCE_GAP);

  const start = Date.now();

  const { rows } = await pool.query(
    `
    SELECT doc_id, content,
           1 - (embedding <=> $1::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> $1::vector
    LIMIT 2
    `,
    [toPgVector(embedding)]
  );

  console.log("↳ candidates_found:", rows.length);
  console.log("↳ time_ms:", Date.now() - start);

  if (!rows.length) {
    console.log("↳ result: no_match");
    return null;
  }

  const best = rows[0];
  const second = rows[1];

  console.log("↳ best_similarity:", best.similarity.toFixed(4));
  if (second) {
    console.log("↳ second_similarity:", second.similarity.toFixed(4));
  }

  if (best.similarity < SIMILARITY_THRESHOLD) {
    console.log("↳ rejected: below_threshold");
    return null;
  }

  if (second && best.similarity - second.similarity < CONFIDENCE_GAP) {
    console.log("↳ rejected: low_confidence_gap");
    return null;
  }

  console.log("↳ result: accepted");

  return {
    text: best.content,
    docId: best.doc_id,
    similarity: best.similarity
  };
}

