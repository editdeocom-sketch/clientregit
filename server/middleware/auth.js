const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/database');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = queryOne('SELECT id, name, email, role, avatar, phone FROM users WHERE id = ?', [decoded.id]);
      if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }
  res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') { next(); }
  else { return res.status(403).json({ success: false, message: 'Not authorized as admin' }); }
};

module.exports = { protect, admin };
