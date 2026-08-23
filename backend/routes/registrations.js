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
      coordinatorMessage: r.coordinatorMessage || '',
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

const { sendRegistrationStatusEmail } = require('../utils/sendEmail');

// PATCH — approve or reject a registration (admin/coordinator, only for their clubs)
router.patch('/:id/status', protect, roleGuard('admin', 'coordinator'), async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const reg = await Registration.findById(req.params.id)
      .populate('user',  'name email')
      .populate('club',  'name category')
      .populate('event', 'title date venue club');

    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    // Verify this registration belongs to an assigned club
    const assignedClubs = (req.user.assignedClubs || []).map(String);
    const clubId = reg.type === 'club'
      ? String(reg.club?._id || reg.club)
      : String(reg.event?.club?._id || reg.event?.club);

    if (!assignedClubs.includes(clubId))
      return res.status(403).json({ message: 'Access denied — not your club' });

    reg.status = status;
    if (message !== undefined) {
      reg.coordinatorMessage = message;
    }
    await reg.save();

    // Trigger email notification asynchronously
    if (reg.user?.email) {
      sendRegistrationStatusEmail({
        to:          reg.user.email,
        studentName: reg.user.name,
        type:        reg.type,
        name:        reg.type === 'club' ? (reg.club?.name || 'Club') : (reg.event?.title || 'Event'),
        status:      reg.status,
        message:     reg.coordinatorMessage || '',
        eventDate:   reg.type === 'event' ? reg.event?.date : null,
        eventVenue:  reg.type === 'event' ? reg.event?.venue : null,
      }).catch(emailErr => {
        console.error('Email send error:', emailErr);
      });
    }

    res.json({ message: 'Status updated and notification triggered', registration: reg });
  } catch (err) {
    console.error('Error updating registration status:', err);
    res.status(500).json({ message: 'Error updating status' });
  }
});

module.exports = router;
