// server.js
// EduEvent Manager — Express Backend Entry Point

require('dotenv').config();
const express  = require('express');
const path = require("path");
const mongoose = require('mongoose');
const cors     = require('cors');
const { startReminderScheduler } = require('./jobs/reminderScheduler');

const app = express();

// ── Middleware ──────────────────────────────────
app.use(cors({ origin: '*' }));           // Allow all origins for local dev
app.use(express.json({ limit: '10mb' })); 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));                 // Parse JSON request bodies
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Routes ──────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/interests',     require('./routes/interests'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/manager',       require('./routes/manager'));


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

    // Start the pre-event reminder scheduler (24h + 2h emails) after DB is up
    startReminderScheduler();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  });
