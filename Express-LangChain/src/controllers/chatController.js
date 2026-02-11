const { getResponse } = require('../models/chatModel');
const { v4: uuidv4 } = require('uuid');

const chatHistories = {};
const sessionTimeout = 2 * 60 * 1000;

function cleanupSessions() {
  const now = Date.now();
  for (const sessionId in chatHistories) {
    const session = chatHistories[sessionId];
    if (!session) continue;

    const { lastActivity, createdAt } = session;
    if (now - lastActivity > sessionTimeout) {
      const expiredAt = now;

      console.log('Session expired and removed:', {
        sessionId,
        createdAt,
        lastActivity,
        expiredAt
      });

      delete chatHistories[sessionId];
    }
  }
}

setInterval(cleanupSessions, 3 * 60 * 1000);

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

    const createdAt = Date.now();
    const expiresAt = createdAt + sessionTimeout;

    console.log('New session created:', { sessionId, createdAt, expiresAt });

    console.log('Session will expire at:', { sessionId, expiresAt: new Date(expiresAt).toLocaleString() });
  }

  if (!chatHistories[sessionId]) {
    chatHistories[sessionId] = {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: [
        {
          role: 'system',
          content:
            "Summarize the main points of the below provided text. Focus on the key ideas, central theme, important characters or concepts, and the conclusion or outcome in very short sentences. Keep it simple and straightforward for easy understanding.",
        },
      ],
    };
  }

  const session = chatHistories[sessionId];

  session.lastActivity = Date.now();
  session.messages.push({ role: 'user', content: question });

  try {
    console.log('Generated Prompt with Memory (messages):', session.messages);

    if (
      question.toLowerCase() === 'what did i ask earlier?' ||
      question.toLowerCase() === 'what questions did i ask?'
    ) {
      const previousQuestions = session.messages
        .filter((msg) => msg.role === 'user')
        .map((msg) => msg.content);

      if (previousQuestions.length === 0) {
        return res.json({ answer: "You haven't asked any questions yet." });
      }

      return res.json({
        answer: 'You previously asked: ' + previousQuestions.join(', '),
      });
    }

    const result = await getResponse(session.messages);

    session.messages.push({ role: 'assistant', content: result });

    console.log('Generated response:', { answer: result });
    console.log('===== REQUEST END =====\n');

    return res.json({ answer: result });
  } catch (error) {
    console.error('Error generating response:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { askQuestion };
