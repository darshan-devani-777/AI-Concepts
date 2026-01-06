import { createEmbedding } from "../models/embeddingModel.js";
import { addVector, searchVector } from "../models/vectoreStore.js";
import { generateAnswer } from "../models/generationModel.js";
import { MongoDocument } from "../models/mongoDocument.js";
import { ChatLog } from "../models/chatLog.js";

export async function addDocument(req, res) {
  try {
    const { id, text } = req.body;

    console.log("\n📥 ADD DOCUMENT");
    console.log("➡️ docId:", id);

    if (!id || !text) {
      console.log("❌ Validation failed");
      return res.status(400).json({ error: "id and text are required" });
    }

    const embedding = await createEmbedding(text);
    await addVector(id, embedding, text);
    await MongoDocument.create({ docId: id, text });

    console.log("✅ Document stored successfully");
    res
      .status(200)
      .json({ message: "Document stored successfully", data: { id, text } });
  } catch (err) {
    console.error("🔥 ADD DOCUMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function chat(req, res) {
  try {
    const { query } = req.body;

    console.log("\n💬 CHAT REQUEST");
    console.log("➡️ Query:", query);

    const embedding = await createEmbedding(query);
    const result = await searchVector(embedding);

    if (!result) {
      const response = {
        answer: "I don't know",
        source: null,
        similarity: null,
      };

      console.log("\n📦 FINAL ANSWER");
      console.log(JSON.stringify(response, null, 2));

      await ChatLog.create({
        query,
        answer: response.answer,
        source: null,
        docId: null,
        similarity: null,
      });

      console.log("\n📊 CHAT LOG");
      console.log("  ↳ saved: true");
      console.log("\n✅ CHAT COMPLETED");

      return res.json(response);
    }

    const answer = await generateAnswer(result.text, query);

    const response = {
      answer,
      source: result.text,
      similarity: Number(result.similarity.toFixed(6)),
    };

    console.log("\n📦 FINAL ANSWER");
    console.log(JSON.stringify(response, null, 2));

    await ChatLog.create({
      query,
      answer,
      source: result.text,
      docId: result.docId,
      similarity: result.similarity,
    });

    console.log("\n📊 CHAT LOG");
    console.log("  ↳ saved: true");
    console.log("\n✅ CHAT COMPLETED");

    return res.json(response);
  } catch (err) {
    console.error("🔥 CHAT ERROR:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
