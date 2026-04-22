// routes/clubs.js
const express      = require('express');
const Club         = require('../models/Club');
const Registration = require('../models/Registration');
const { protect, roleGuard } = require('../middleware/auth');

const router = express.Router();

// GET all clubs — students see all; admin/coord see only their assigned clubs
router.get('/', protect, async (req, res) => {
  try {
    let clubs;
    if (req.user.role === 'student') {
      clubs = await Club.find().sort({ createdAt: -1 });
    } else {
      // admin/coordinator: only their assigned clubs
      clubs = await Club.find({ _id: { $in: req.user.assignedClubs || [] } }).sort({ name: 1 });
    }
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching clubs' });
  }
});

// GET single club
router.get('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('coordinator', 'name email');
    if (!club) return res.status(404).json({ message: 'Club not found' });
    // access check for non-students
    if (req.user.role !== 'student') {
      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(club._id)))
        return res.status(403).json({ message: 'Access denied to this club' });
    }
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching club' });
  }
});

// CREATE club — coordinator/admin only, auto-assigned to them
router.post('/', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name || !description || !category)
      return res.status(400).json({ message: 'Name, description and category are required' });

    const club = await Club.create({ name, description, category, coordinator: req.user.id });

    // Auto-assign this new club to the creator
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { assignedClubs: club._id } });

    res.status(201).json(club);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Club name already exists' });
    res.status(500).json({ message: 'Error creating club' });
  }
});

// REGISTER student for a club
router.post('/register', protect, async (req, res) => {
  try {
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ message: 'clubId is required' });

    const existing = await Registration.findOne({ user: req.user.id, club: clubId, type: 'club' });
    if (existing) return res.status(409).json({ message: 'Already registered for this club' });

    const reg = await Registration.create({ user: req.user.id, club: clubId, type: 'club' });
    await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: 1 } });
    res.status(201).json({ message: 'Registration submitted', registration: reg });
  } catch (err) {
    res.status(500).json({ message: 'Error registering for club' });
  }
});

// UPDATE club — only if assigned to this user
router.put('/:id', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const assigned = (req.user.assignedClubs || []).map(String);
    if (!assigned.includes(req.params.id))
      return res.status(403).json({ message: 'Access denied to this club' });
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: 'Error updating club' });
  }
});

module.exports = router;
