import { createEmbedding } from "../models/embeddingModel.js";
import { addVector, searchVector } from "../models/vectoreStore.js";
import { generateAnswer } from "../models/generationModel.js";
import { pool } from "../db/postgres.js";

export async function addDocument(req, res) {
  try {
    const { id, text } = req.body;

    console.log("\n📥 ADD DOCUMENT");
    console.log("➡️ docId:", id);

    if (!id || !text) {
      return res.status(400).json({ error: "id and text are required" });
    }

    const embedding = await createEmbedding(text);
    await addVector(id, embedding, text);

    res.json({ message: "Document stored successfully" });
  } catch (err) {
    console.error("🔥 ADD DOCUMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function chat(req, res) {
  try {
    const { query } = req.body;

    console.log("\n💬 CHAT REQUEST");
    console.log("↳ query:", query);

    const start = Date.now();

    const embedding = await createEmbedding(query);
    const result = await searchVector(embedding);

    let response;

    if (!result) {
      console.log("↳ answer_mode: fallback");
      response = {
        answer: "I don't know",
        source: null,
        similarity: null
      };
    } else {
      console.log("↳ answer_mode: RAG");
      const answer = await generateAnswer(result.text, query);
      response = {
        answer,
        source: result.text,
        similarity: Number(result.similarity.toFixed(6))
      };
    }

    await pool.query(
      `
      INSERT INTO chat_logs (query, answer, source, doc_id, similarity)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        query,
        response.answer,
        response.source,
        result?.docId ?? null,
        result?.similarity ?? null
      ]
    );

    console.log("↳ chat_logged: true");
    console.log("↳ total_time_ms:", Date.now() - start);

    res.json(response);
  } catch (err) {
    console.error("🔥 CHAT ERROR:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

