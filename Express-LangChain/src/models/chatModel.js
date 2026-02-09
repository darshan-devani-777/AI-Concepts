require('dotenv').config();
const { ChatGroq } = require('@langchain/groq');

async function getResponse(messages) {
  const llm = new ChatGroq({
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    maxTokens: 500,
    maxRetries: 2,
  });

  try {
    const aiMsg = await llm.invoke(messages);
    return aiMsg.content;
  } catch (error) {
    throw new Error('Error invoking ChatGroq model:', error);
  }
}

module.exports = { getResponse };
