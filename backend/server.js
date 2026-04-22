// server.js
// EduEvent Manager — Express Backend Entry Point

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── Middleware ──────────────────────────────────
app.use(cors({ origin: '*' }));           // Allow all origins for local dev
app.use(express.json());                  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/interests',     require('./routes/interests'));
app.use('/api/registrations', require('./routes/registrations'));

// ── Health check ────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ EduEvent Manager API is running', version: '1.0.0' });
});

// ── 404 handler ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ── MongoDB connection + server start ───────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edueventdb';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  });
