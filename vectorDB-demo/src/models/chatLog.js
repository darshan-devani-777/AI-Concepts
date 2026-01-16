import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema({
  query: String,
  answer: String,
  source: String,
  docId: Number,
  similarity: Number
}, { timestamps: true });

export const ChatLog = mongoose.model("ChatLog", chatLogSchema);
