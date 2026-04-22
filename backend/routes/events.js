// routes/events.js
const express      = require('express');
const Event        = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, roleGuard } = require('../middleware/auth');

const router = express.Router();

// GET events — students see all; admin/coord see only events for their clubs
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'student') {
      query.club = { $in: req.user.assignedClubs || [] };
    }
    const events = await Event.find(query)
      .populate('club', 'name category')
      .sort({ date: 1 });

    const result = events.map(e => ({
      _id: e._id, title: e.title, description: e.description,
      date: e.date, venue: e.venue,
      clubId: e.club?._id, clubName: e.club?.name || 'Unknown',
      category: e.club?.category,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// GET single event
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name category');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role !== 'student') {
      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(event.club._id)))
        return res.status(403).json({ message: 'Access denied to this event' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// CREATE event — only for assigned clubs
router.post('/', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const { title, description, clubId, date, venue } = req.body;
    if (!title || !clubId || !date || !venue)
      return res.status(400).json({ message: 'Title, clubId, date and venue are required' });

    const assigned = (req.user.assignedClubs || []).map(String);
    if (!assigned.includes(String(clubId)))
      return res.status(403).json({ message: 'You can only create events for your assigned clubs' });

    const event = await Event.create({ title, description, club: clubId, date, venue, createdBy: req.user.id });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error creating event' });
  }
});

// REGISTER student for event
router.post('/register', protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: 'eventId is required' });
    const existing = await Registration.findOne({ user: req.user.id, event: eventId, type: 'event' });
    if (existing) return res.status(409).json({ message: 'Already registered for this event' });
    const reg = await Registration.create({ user: req.user.id, event: eventId, type: 'event' });
    res.status(201).json({ message: 'Event registration submitted', registration: reg });
  } catch (err) {
    res.status(500).json({ message: 'Error registering for event' });
  }
});

// UPDATE event — only for assigned clubs
router.put('/:id', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const assigned = (req.user.assignedClubs || []).map(String);
    if (!assigned.includes(String(event.club)))
      return res.status(403).json({ message: 'Access denied to this event' });
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating event' });
  }
});

// DELETE event — only for assigned clubs
router.delete('/:id', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const assigned = (req.user.assignedClubs || []).map(String);
    if (!assigned.includes(String(event.club)))
      return res.status(403).json({ message: 'Access denied' });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;
