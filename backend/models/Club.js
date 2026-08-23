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
  coordinatorContact: { type: String, default: '' },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  logoUrl:       { type: String, default: '' },
  memberCount:   { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('Club', clubSchema);

