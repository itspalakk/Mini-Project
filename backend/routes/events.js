// routes/events.js
const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const Event        = require('../models/Event');
const Registration = require('../models/Registration');
const User         = require('../models/User');
const { protect, roleGuard } = require('../middleware/auth');
const { sendEventRegistrationConfirmationEmail } = require('../utils/sendEmail');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'events');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET events — students & club managers see all; admin/coord see only events for their clubs
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'student' && req.user.role !== 'club_manager') {
      query.club = { $in: req.user.assignedClubs || [] };
    }

    const events = await Event.find(query)
      .populate('club', 'name category')
      .sort({ date: 1 });

    const result = events.map(e => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      date: e.date,
      venue: e.venue,
      image: e.image,
      posterUrl: e.posterUrl,
      clubId: e.club?._id,
      clubName: e.club?.name || 'Unknown',
      category: e.club?.category,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// GET live events for student dashboard
router.get('/live/now', protect, async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const events = await Event.find({
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    })
      .populate('club', 'name category')
      .sort({ date: 1 });

    const result = events.map(e => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      date: e.date,
      venue: e.venue,
      image: e.image,
      posterUrl: e.posterUrl,
      clubId: e.club?._id,
      clubName: e.club?.name || 'Unknown',
      category: e.club?.category,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching live events' });
  }
});

// GET single event
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club', 'name category');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'student' && req.user.role !== 'club_manager') {
      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(event.club._id))) {
        return res.status(403).json({ message: 'Access denied to this event' });
      }
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// CREATE event — only for assigned clubs
router.post(
  '/',
  protect,
  roleGuard('coordinator', 'admin'),
  upload.single('poster'),
  async (req, res) => {
    try {
      const { title, description, clubId, date, venue, image } = req.body;

      if (!title || !clubId || !date || !venue) {
        return res.status(400).json({ message: 'Title, clubId, date and venue are required' });
      }

      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(clubId))) {
        return res.status(403).json({ message: 'You can only create events for your assigned clubs' });
      }

      const posterUrl = req.file ? `/uploads/events/${req.file.filename}` : '';

      const event = await Event.create({
        title,
        description,
        club: clubId,
        date,
        venue,
        image,
        posterUrl,
        createdBy: req.user.id,
      });

      res.status(201).json(event);
    } catch (err) {
      res.status(500).json({ message: 'Error creating event' });
    }
  }
);

// REGISTER student for event
router.post('/register', protect, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    // Club managers have oversight access only — they cannot register for events
    if (req.user.role === 'club_manager') {
      return res.status(403).json({ message: 'Club managers cannot register for events' });
    }

    // 1. Validate event exists (populate club so the confirmation email has the club name)
    const event = await Event.findById(eventId).populate('club', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Check duplicate registration
    const existing = await Registration.findOne({
      user: req.user.id,
      event: eventId,
      type: 'event',
    });

    if (existing) {
      return res.status(409).json({ message: 'Already registered for this event' });
    }

    // 3. Create registration (default status is "pending")
    const reg = await Registration.create({
      user: req.user.id,
      event: eventId,
      type: 'event',
    });

    // 4. Return the registration response as currently done
    res.status(201).json({
      message: 'Event registration submitted',
      registration: reg,
    });

    // 5. Trigger confirmation email asynchronously (fire-and-forget).
    //    The email must NOT prevent the registration API from succeeding,
    //    so any failure is merely logged server-side.
    User.findById(req.user.id)
      .select('name email')
      .then(student => {
        if (!student || !student.email) return null;

        return sendEventRegistrationConfirmationEmail({
          to:          student.email,
          studentName: student.name,
          eventName:   event.title,
          eventDate:   event.date,
          eventVenue:  event.venue,
          clubName:    event.club?.name || 'Unknown',
        });
      })
      .then(sent => {
        if (sent) {
          // Mark that the confirmation email was sent (prevents duplicate sends)
          return Registration.updateOne(
            { _id: reg._id },
            { $set: { confirmationEmailSent: true } }
          );
        }
      })
      .catch(emailErr => {
        console.error('Confirmation email send error:', emailErr);
      });
  } catch (err) {
    res.status(500).json({ message: 'Error registering for event' });
  }
});

// UPDATE event — only for assigned clubs
router.put(
  '/:id',
  protect,
  roleGuard('coordinator', 'admin'),
  upload.single('poster'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(event.club))) {
        return res.status(403).json({ message: 'Access denied to this event' });
      }

      const updateData = { ...req.body };

      if (req.file) {
        updateData.posterUrl = `/uploads/events/${req.file.filename}`;
      }

      const updated = await Event.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      // If the event date/time actually changed, recalculate reminder eligibility:
      // clear the reminder-sent timestamps for approved registrations so the
      // scheduler recomputes the 24h/2h reminders against the new date/time.
      if (req.body.date && new Date(req.body.date).getTime() !== new Date(event.date).getTime()) {
        await Registration.updateMany(
          { type: 'event', event: event._id, status: 'approved' },
          { $set: { reminder24hSentAt: null, reminder2hSentAt: null } }
        );
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Error updating event' });
    }
  }
);

// DELETE event — only for assigned clubs
router.delete('/:id', protect, roleGuard('coordinator', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const assigned = (req.user.assignedClubs || []).map(String);
    if (!assigned.includes(String(event.club))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;