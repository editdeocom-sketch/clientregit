require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { getDb, initializeDatabase, saveDb } = require('./database/database');
const getExchangeRate = require('./utils/exchangeRate');

const app = express();

(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) throw new Error('JWT_SECRET must be configured with at least 16 characters');
  const database = await getDb();
  initializeDatabase(database);
  app.locals.db = database;
  app.locals.saveDb = saveDb;

  const videoUploadDir = path.join(__dirname, '..', 'uploads', 'videos');
  fs.mkdirSync(videoUploadDir, { recursive: true });
  app.locals.videoUploadDir = videoUploadDir;

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan('dev'));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads/videos', express.static(videoUploadDir, { acceptRanges: true }));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ClientRegit API is running' });
  });

  app.get('/api/exchange-rate', async (req, res) => {
    try {
      const data = await getExchangeRate(req.query.currency);
      res.json({ success: true, data });
    } catch (error) {
      res.status(503).json({ success: false, message: error.message });
    }
  });

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/clients', require('./routes/clientRoutes'));
  app.use('/api/projects', require('./routes/projectRoutes'));
  app.use('/api/tasks', require('./routes/taskRoutes'));
  app.use('/api/videos', require('./routes/videoRoutes'));
  app.use('/api/invoices', require('./routes/invoiceRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.use((err, req, res, next) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'Video file must be 300MB or smaller' });
    if (err.message === 'Invalid video type') return res.status(400).json({ success: false, message: err.message });
    res.status(err.statusCode || 500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error') });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})().catch((error) => {
  console.error('ClientRegit failed to start:', error);
  process.exitCode = 1;
});
