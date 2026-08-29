const { checkLimit } = require('../services/billingService');

function enforceLimit(resource) {
  return (req, res, next) => {
    try {
      const result = checkLimit(req.user.id, resource);
      if (!result.allowed) {
        if (req.file) { const fs = require('fs'); try { fs.unlinkSync(req.file.path); } catch (error) { /* preserve plan response */ } }
        return res.status(403).json({ success: false, code: 'PLAN_LIMIT_REACHED', message: "You've reached your Free plan limit. Upgrade to Pro to continue." });
      }
      req.billing = result;
      next();
    } catch (error) { next(error); }
  };
}

function enforceVideoStorage(req, res, next) {
  try {
    if (!req.file) return next();
    const result = checkLimit(req.user.id, 'storageBytes', req.file.size);
    if (!result.allowed) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch (error) { /* preserve limit response */ }
      return res.status(403).json({ success: false, code: 'PLAN_LIMIT_REACHED', message: 'Your plan storage limit has been reached. Upgrade to continue.' });
    }
    next();
  } catch (error) { next(error); }
}

module.exports = { enforceLimit, enforceVideoStorage };
