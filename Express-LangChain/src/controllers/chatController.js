const { getResponse } = require('../models/chatModel');
const { v4: uuidv4 } = require('uuid');

const chatHistories = {};
const sessionTimeout = 30 * 60 * 1000;

function cleanupSessions() {
  const now = Date.now();
  for (const sessionId in chatHistories) {
    const lastActivity = chatHistories[sessionId].lastActivity;
    if (now - lastActivity > sessionTimeout) {
      console.log(`Session ${sessionId} expired and removed.`);
      delete chatHistories[sessionId];
    }
  }
}

setInterval(cleanupSessions, 10 * 60 * 1000);

async function askQuestion(req, res) {
  const { question } = req.body;

  console.log("\n===== NEW CHAT REQUEST =====\n");
  console.log('Received request body:', req.body);

  if (!question) {
    console.warn('No question received in request.');
    return res.status(400).json({ error: 'Question is required.' });
  }

  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('sessionId', sessionId, { maxAge: sessionTimeout });
    console.log(`New session created: ${sessionId}`);
  }

  if (!chatHistories[sessionId]) {
    chatHistories[sessionId] = [
      {
        role: 'system',
        content:
          "Summarize the main points of the below provided text. Focus on the key ideas, central theme, important characters or concepts, and the conclusion or outcome in very short sentences. Keep it simple and straightforward for easy understanding.",
      },
    ];
  }

  let history = chatHistories[sessionId];

  chatHistories[sessionId].lastActivity = Date.now();

  history.push({ role: 'user', content: question });

  try {
    console.log('Generated Prompt with Memory (history):', history);

    if (question.toLowerCase() === "what did i ask earlier?" || question.toLowerCase() === "what questions did i ask?") {
      const previousQuestions = history.filter(msg => msg.role === 'user').map(msg => msg.content);

      if (previousQuestions.length === 0) {
        return res.json({ answer: "You haven't asked any questions yet." });
      }

      return res.json({ answer: "You previously asked: " + previousQuestions.join(', ') });
    }

    const result = await getResponse(history);

    history.push({ role: 'assistant', content: result });

    console.log('Generated response:', { answer: result });
    console.log("===== REQUEST END =====\n");

    return res.json({ answer: result });
  } catch (error) {
    console.error('Error generating response:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { askQuestion };
