// routes/interests.js
// POST /api/interests/save            — save user's selected interests
// GET  /api/interests/my              — fetch current user's interests
// GET  /api/interests/recommendations — return clubs matching user interests

const express = require('express');
const User    = require('../models/User');
const Club    = require('../models/Club');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* ── SAVE interests ── */
router.post('/save', protect, async (req, res) => {
  try {
    const { interests } = req.body; // array of strings e.g. ['Technology', 'Sports']
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'interests must be an array' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { interests },
      { new: true }
    );
    res.json({ message: 'Interests saved', interests: user.interests });
  } catch (err) {
    res.status(500).json({ message: 'Error saving interests' });
  }
});

/* ── GET current user interests ── */
router.get('/my', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('interests');
    res.json({ interests: user?.interests || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching interests' });
  }
});

/* ── GET recommendations ── */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('interests');
    const interests = user?.interests || [];

    if (interests.length === 0) {
      return res.json({ clubs: [] });
    }

    // Find clubs whose category matches any of the user's interests
    const clubs = await Club.find({ category: { $in: interests } }).limit(10);
    res.json({ clubs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

module.exports = router;
