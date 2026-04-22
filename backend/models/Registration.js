// models/Registration.js
// Registration schema — for both clubs and events

const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['club', 'event'], required: true },
  // One of these will be set depending on type
  club:     { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model('Registration', registrationSchema);
