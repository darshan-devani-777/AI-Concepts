const { logAPI } = require('../utils/log');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  logAPI('REQUEST_START', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')?.substring(0, 50) + '...' || 'unknown'
  });

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    logAPI('REQUEST_COMPLETE', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 'unknown'
    });

    originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestLogger;
