require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { getDb, initializeDatabase, saveDb } = require('./database/database');
const { initAdminTables } = require('./database/adminSchema');
const getExchangeRate = require('./utils/exchangeRate');

const app = express();

(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) throw new Error('JWT_SECRET must be configured with at least 16 characters');
  const database = await getDb();
  initializeDatabase(database);
  initAdminTables(database);
  app.locals.db = database;
  app.locals.saveDb = saveDb;

  const videoUploadDir = path.join(__dirname, '..', 'uploads', 'videos');
  fs.mkdirSync(videoUploadDir, { recursive: true });
  app.locals.videoUploadDir = videoUploadDir;

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan('dev'));
  const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
  if (process.env.NODE_ENV !== 'production') allowedOrigins.push('http://localhost:5000');
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '10mb', verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ClientRegit API is running' });
  });

  app.get('/api/exchange-rate', async (req, res) => {
    try {
      const data = await getExchangeRate(req.query.currency);
      res.json({ success: true, data });
    } catch (error) {
      console.error('EXCHANGE_RATE_ERROR', error);
      res.status(503).json({ success: false, message: 'Exchange rate service unavailable' });
    }
  });

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts, please try again later' } });
  const billingLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, please try again later' } });
  const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many admin requests' } });
  const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many uploads' } });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/billing/create-order', billingLimiter);
  app.use('/api/billing/create-subscription', billingLimiter);
  app.use('/api/billing/validate-coupon', billingLimiter);
  app.use('/api/billing/verify-payment', billingLimiter);
  app.use('/api/billing/verify-subscription', billingLimiter);
  app.use('/api/admin', adminLimiter);

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/clients', require('./routes/clientRoutes'));
  app.use('/api/projects', require('./routes/projectRoutes'));
  app.use('/api/tasks', require('./routes/taskRoutes'));
  app.use('/api/videos', require('./routes/videoRoutes'));
  app.use('/api/invoices', require('./routes/invoiceRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));

  app.use('/api/billing', require('./routes/billingRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  app.use('/api/public', require('./routes/publicPageRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  const { protect } = require('./middleware/auth');
  app.use('/uploads/videos', protect, express.static(videoUploadDir, { acceptRanges: true }));

  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  const hasClient = fs.existsSync(clientDist);
  if (hasClient) {
    app.use(express.static(clientDist));
  }

  app.use((err, req, res, next) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'Video file must be 300MB or smaller' });
    if (err.message === 'Invalid video type') return res.status(400).json({ success: false, message: err.message });
    res.status(err.statusCode || 500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error') });
  });

  if (hasClient) {
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'Not found' });
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down...');
    server.close(() => { saveDb(); process.exit(0); });
    setTimeout(() => { saveDb(); process.exit(1); }, 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})().catch((error) => {
  console.error('ClientRegit failed to start:', error);
  process.exitCode = 1;
});
