function sendServerError(res, error, message = 'Internal server error') {
  console.error('REQUEST_ERROR', error);
  return res.status(500).json({ success: false, message });
}

module.exports = { sendServerError };
