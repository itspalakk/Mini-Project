// routes/clubs.js
const express      = require('express');
const Club         = require('../models/Club');
const User         = require('../models/User');
const Registration = require('../models/Registration');
const { protect, roleGuard } = require('../middleware/auth');

const router = express.Router();

// GET all clubs — students & club managers see all; admin/coord see only their assigned clubs
router.get('/', protect, async (req, res) => {
  try {
    let clubs;
    if (req.user.role === 'student' || req.user.role === 'club_manager') {
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
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    
    // access check for non-students and non-managers
    if (req.user.role !== 'student' && req.user.role !== 'club_manager') {
      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(String(club._id)))
        return res.status(403).json({ message: 'Access denied to this club' });
    }

    // Fetch all admins & coordinators assigned to this club (with login credentials)
    const User = require('../models/User');
    const staff = await User.find({ 
      assignedClubs: club._id, 
      role: { $in: ['coordinator', 'admin'] } 
    }).select('name email role loginId');

    const responseData = { ...club.toObject(), staff };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching club' });
  }
});

// CREATE club — club_manager only.
// Creates the club AND a brand-new coordinator account dedicated to it, in one request.
router.post('/', protect, roleGuard('club_manager'), async (req, res) => {
  try {
    const { name, description, category, logoUrl, status, coordinator } = req.body;

    // ── Club field validation ──
    if (!name || !description || !category)
      return res.status(400).json({ message: 'Name, description and category are required' });

    // ── Coordinator field validation ──
    const cName     = typeof coordinator?.name === 'string' ? coordinator.name.trim() : '';
    const cEmail    = typeof coordinator?.email === 'string' ? coordinator.email.trim().toLowerCase() : '';
    const cLoginId  = typeof coordinator?.loginId === 'string' ? coordinator.loginId.trim() : '';
    const cPassword = coordinator?.password;
    const cContact  = typeof coordinator?.contact === 'string' ? coordinator.contact.trim() : '';

    if (!cName || !cEmail || !cLoginId || !cPassword)
      return res.status(400).json({ message: 'Coordinator name, email, login ID and password are required' });

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cEmail))
      return res.status(400).json({ message: 'Please enter a valid coordinator email address' });

    if (String(cPassword).length < 6)
      return res.status(400).json({ message: 'Coordinator password must be at least 6 characters' });

    // ── Duplicate checks (before any writes) ──
    const emailExists = await User.findOne({ email: cEmail });
    if (emailExists)
      return res.status(409).json({ message: 'Coordinator email is already registered to another account' });

    const idExists = await User.findOne({ loginId: cLoginId.toUpperCase() });
    if (idExists)
      return res.status(409).json({ message: 'Coordinator Login ID is already taken' });

    // ── 1) Create the club ──
    let club;
    try {
      club = await Club.create({
        name,
        description,
        category,
        status: status || 'active',
        logoUrl: logoUrl || '🏛️',
        coordinatorContact: cContact,
      });
    } catch (err) {
      if (err && err.code === 11000) return res.status(409).json({ message: 'Club name already exists' });
      throw err;
    }

    // ── 2) Create the coordinator bound ONLY to this new club ──
    try {
      const coord = await User.create({
        name: cName,
        email: cEmail,
        password: cPassword,               // hashed by the existing bcrypt pre-save hook
        role: 'coordinator',
        loginId: cLoginId.toUpperCase(),   // stored uppercase — matches existing login behaviour
        assignedClubs: [club._id],         // exactly this one club; cannot be assigned elsewhere here
      });

      // ── 3) Link club -> coordinator ──
      club.coordinator = coord._id;
      await club.save();

      return res.status(201).json({
        message: 'Club and coordinator created successfully',
        club: club.toObject(),
        coordinator: {
          id: coord._id,
          name: coord.name,
          email: coord.email,
          loginId: coord.loginId,
          role: coord.role,
        },
      });
    } catch (err) {
      // Roll back the club so we never leave a club without a coordinator
      await Club.findByIdAndDelete(club._id).catch(() => {});
      if (err && err.code === 11000)
        return res.status(409).json({ message: 'Coordinator email or Login ID already exists' });
      throw err;
    }
  } catch (err) {
    console.error('Create club error:', err);
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

// UPDATE club — club_manager can update any; coordinator/admin only if assigned
router.put('/:id', protect, roleGuard('club_manager', 'coordinator', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'club_manager') {
      const assigned = (req.user.assignedClubs || []).map(String);
      if (!assigned.includes(req.params.id))
        return res.status(403).json({ message: 'Access denied to this club' });
    }

    const oldClub = await Club.findById(req.params.id);
    if (!oldClub) return res.status(404).json({ message: 'Club not found' });

    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Sync assigned coordinator if it changed
    if (req.body.coordinator !== undefined && String(oldClub.coordinator) !== String(req.body.coordinator)) {
      const User = require('../models/User');
      if (oldClub.coordinator) {
        await User.findByIdAndUpdate(oldClub.coordinator, { $pull: { assignedClubs: club._id } });
      }
      if (req.body.coordinator) {
        await User.findByIdAndUpdate(req.body.coordinator, { $addToSet: { assignedClubs: club._id } });
      }
    }

    res.json(club);
  } catch (err) {
    res.status(500).json({ message: 'Error updating club' });
  }
});

// DELETE club — club_manager only, requires password confirmation
router.delete('/:id', protect, roleGuard('club_manager'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password confirmation is required' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password confirmation' });

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Delete the club
    await Club.findByIdAndDelete(req.params.id);

    // Remove club assignment from all users
    await User.updateMany(
      { assignedClubs: req.params.id },
      { $pull: { assignedClubs: req.params.id } }
    );

    // Delete associated events and registrations
    const Event = require('../models/Event');
    const clubEvents = await Event.find({ club: req.params.id });
    const eventIds = clubEvents.map(e => e._id);

    await Event.deleteMany({ club: req.params.id });
    await Registration.deleteMany({
      $or: [
        { club: req.params.id, type: 'club' },
        { event: { $in: eventIds }, type: 'event' }
      ]
    });

    res.json({ message: 'Club and all associated events/registrations deleted successfully' });
  } catch (err) {
    console.error('Delete club error:', err);
    res.status(500).json({ message: 'Error deleting club' });
  }
});

module.exports = router;

