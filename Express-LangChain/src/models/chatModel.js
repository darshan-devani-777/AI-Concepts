require('dotenv').config();
const { ChatGroq } = require('@langchain/groq');

async function getTranslation(messages) {
  const llm = new ChatGroq({
    model: 'llama-3.1-8b-instant',
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
  });

  try {
    const aiMsg = await llm.invoke(messages);
    return aiMsg.content;
  } catch (error) {
    throw new Error('Error invoking ChatGroq model:', error);
  }
}

module.exports = { getTranslation };
