const express = require('express');
const router = express.Router();
const { queryGroq } = require('../utils/groqClient');
const AIRequest = require('../models/AIRequest');
const auth = require('../middleware/auth');
const validateInput = require('../middleware/validateInput');
const promptFilter = require('../middleware/promptFilter');

router.post('/response', auth, validateInput, promptFilter, async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log({
      message: 'Sending to Groq API',
      prompt,
      role: req.role,
    });

    const messages = [
      {
        role: 'system',
        content:
          req.role === 'admin'
            ? 'You are an admin-level assistant.'
            : 'You are a safe user-level assistant.',
      },
      { role: 'user', content: prompt },
    ];

    const data = await queryGroq(messages);
    const output = data.choices[0].message.content;

    await AIRequest.create({
      role: req.role,
      prompt,
      response: output,
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    });

    console.log({
      message: 'Received from Groq API',
      response: output,  
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    });

    res.json({
      response: output,
      usage: data.usage,
    });
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
