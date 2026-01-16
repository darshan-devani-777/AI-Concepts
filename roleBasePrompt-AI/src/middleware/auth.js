function auth(req, res, next) {
    const role = req.header('x-user-role');
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Invalid role' });
    }
    req.role = role;
    next();
  }
  
  module.exports = auth;
  