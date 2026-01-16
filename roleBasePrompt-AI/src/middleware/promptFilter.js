function promptFilter(req, res, next) {
    const dangerousPatterns = ['sudo', 'rm -rf', 'DROP TABLE', 'delete from', '--'];
    const { prompt } = req.body;
  
    const containsDanger = dangerousPatterns.some(p =>
      prompt.toLowerCase().includes(p.toLowerCase())
    );
  
    if (containsDanger) {
      return res.status(400).json({ error: 'Prompt contains forbidden patterns.' });
    }
    next();
  }
  
  module.exports = promptFilter;
  