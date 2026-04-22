// routes/registrations.js
const express      = require('express');
const Registration = require('../models/Registration');
const Club         = require('../models/Club');
const Event        = require('../models/Event');
const { protect, roleGuard } = require('../middleware/auth');

const router = express.Router();

// GET current student's own registrations
router.get('/my', protect, async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user.id })
      .populate('club',  'name category')
      .populate('event', 'title date venue')
      .sort({ createdAt: -1 });

    const result = regs.map(r => ({
      _id:    r._id,
      type:   r.type === 'club' ? 'Club' : 'Event',
      name:   r.type === 'club' ? (r.club?.name || 'Unknown') : (r.event?.title || 'Unknown'),
      date:   r.type === 'club' ? r.createdAt : (r.event?.date || r.createdAt),
      status: r.status,
    }));
    res.json({ registrations: result });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching registrations' });
  }
});

// GET registrations for admin/coordinator — only for their assigned clubs
router.get('/club-requests', protect, roleGuard('admin', 'coordinator'), async (req, res) => {
  try {
    const assignedClubs = req.user.assignedClubs || [];

    // Find events belonging to assigned clubs
    const events = await Event.find({ club: { $in: assignedClubs } }, '_id');
    const eventIds = events.map(e => e._id);

    const regs = await Registration.find({
      $or: [
        { type: 'club',  club:  { $in: assignedClubs } },
        { type: 'event', event: { $in: eventIds } },
      ],
    })
      .populate('user',  'name email enrollment')
      .populate('club',  'name category')
      .populate('event', 'title date venue')
      .sort({ createdAt: -1 });

    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching club requests' });
  }
});

// PATCH — approve or reject a registration (admin/coordinator, only for their clubs)
router.patch('/:id/status', protect, roleGuard('admin', 'coordinator'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const reg = await Registration.findById(req.params.id)
      .populate('event', 'club');

    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    // Verify this registration belongs to an assigned club
    const assignedClubs = (req.user.assignedClubs || []).map(String);
    const clubId = reg.type === 'club'
      ? String(reg.club)
      : String(reg.event?.club);

    if (!assignedClubs.includes(clubId))
      return res.status(403).json({ message: 'Access denied — not your club' });

    reg.status = status;
    await reg.save();
    res.json({ message: 'Status updated', registration: reg });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

module.exports = router;
