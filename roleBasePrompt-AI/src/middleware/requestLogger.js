function requestLogger(req, res, next) {
    const start = Date.now();
  
    res.on('finish', () => {
      console.log({
        message: 'AI request completed',
        role: req.role,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start
      });
    });
  
    next();
  }
  
  module.exports = requestLogger;
  