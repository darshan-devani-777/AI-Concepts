import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  docId: { type: Number, unique: true },
  text: String
}, { timestamps: true });

export const MongoDocument = mongoose.model("Document", documentSchema);
