const rateLimit = require('express-rate-limit');
const { runSql } = require('../database/database');

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin requests, please try again later' }
});

function auditMiddleware(action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (req.user && res.statusCode < 400) {
        try {
          const targetType = req.baseUrl.split('/').pop() || '';
          const targetId = req.params.id ? Number(req.params.id) : null;
          runSql(
            'INSERT INTO audit_logs (user_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
            [
              req.user.id,
              action,
              targetType,
              targetId,
              JSON.stringify({ method: req.method, path: req.originalUrl, status: res.statusCode }),
              req.ip || '',
              req.headers['user-agent'] || ''
            ]
          );
        } catch (e) {
          console.error('AUDIT_LOG_ERROR', e);
        }
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { adminRateLimit, auditMiddleware };
