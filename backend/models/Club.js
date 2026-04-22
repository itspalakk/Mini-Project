// models/Club.js
// Club schema — managed by coordinators / admins

const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true, trim: true },
  description:   { type: String, required: true },
  category:      {
    type: String,
    required: true,
    enum: [
      'Technology', 'Arts & Culture', 'Sports', 'Music', 'Science',
      'Literature', 'Photography', 'Dance', 'Entrepreneurship',
      'Social Service', 'Gaming', 'Debate & MUN', 'Film', 'Environment', 'Finance',
    ],
  },
  coordinator:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  memberCount:   { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('Club', clubSchema);
