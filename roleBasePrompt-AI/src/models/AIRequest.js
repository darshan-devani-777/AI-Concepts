const mongoose = require('mongoose');

const AIRequestSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'admin'], required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  totalTokens: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIRequest', AIRequestSchema);
