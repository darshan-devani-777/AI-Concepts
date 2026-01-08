function validateInput(req, res, next) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a string.' });
    }
    next();
  }
  
  module.exports = validateInput;
  