const express = require('express');
const { askQuestion } = require('../controllers/chatController');

const router = express.Router();

router.post('/OpenAI', askQuestion);

module.exports = router;
