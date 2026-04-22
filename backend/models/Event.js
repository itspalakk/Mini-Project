// models/Event.js
// Event schema — linked to a club

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  club:        { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  date:        { type: Date, required: true },
  venue:       { type: String, required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
