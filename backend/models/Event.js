// models/Event.js
// Event schema — linked to a club

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  club:        { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  date:        { type: Date, required: true },
  venue:       { type: String, required: true },
  image:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now },
  posterUrl: {
  type: String,
  default: "",
},
});

module.exports = mongoose.model('Event', eventSchema);
