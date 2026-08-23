// routes/manager.js
const express = require('express');
const Club = require('../models/Club');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { protect, roleGuard } = require('../middleware/auth');

const router = express.Router();

// GET manager dashboard analytics
router.get('/analytics', protect, roleGuard('club_manager'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCoordinators = await User.countDocuments({ role: 'coordinator' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const pendingRequests = await Registration.countDocuments({ status: 'pending' });

    const activeClubs = await Club.countDocuments({ status: 'active' });
    const inactiveClubs = await Club.countDocuments({ status: 'inactive' });

    // Calculate details for clubs
    const clubsList = await Club.find().sort({ memberCount: -1 });

    res.json({
      totalStudents,
      totalCoordinators,
      totalAdmins,
      pendingRequests,
      clubs: {
        active: activeClubs,
        inactive: inactiveClubs,
        total: activeClubs + inactiveClubs,
      },
      clubsList,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    res.status(500).json({ message: 'Error fetching manager analytics data' });
  }
});

module.exports = router;
