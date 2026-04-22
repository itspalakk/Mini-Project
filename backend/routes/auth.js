// routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Club    = require('../models/Club');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eduevent_secret_key_2025';

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, role: user.role, enrollment: user.enrollment, loginId: user.loginId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, enrollment, loginId, assignedClubs } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Please enter a valid email address (e.g. name@gmail.com).' });
}
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!role || role === 'student') {
      if (!enrollment) return res.status(400).json({ message: 'Enrollment ID is required for students' });
    } else {
      if (!loginId) return res.status(400).json({ message: 'Login ID is required' });
      if (!assignedClubs || assignedClubs.length === 0)
        return res.status(400).json({ message: 'At least one club must be assigned' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) return res.status(409).json({ message: 'Email already registered' });

    if (!role || role === 'student') {
      const enrollExists = await User.findOne({ enrollment: enrollment.toUpperCase() });
      if (enrollExists) return res.status(409).json({ message: 'Enrollment ID already registered' });
    } else {
      const idExists = await User.findOne({ loginId: loginId.toUpperCase() });
      if (idExists) return res.status(409).json({ message: 'Login ID already taken' });
      // Limit coordinators to 1 per club, admins to 2 per club
    for (const clubId of assignedClubs) {
  if (role === 'coordinator') {
    const existing = await User.countDocuments({
      role: 'coordinator',
      assignedClubs: clubId
    });
    if (existing >= 1) {
      const club = await Club.findById(clubId).select('name');
      return res.status(409).json({
        message: `Club "${club?.name || clubId}" already has a coordinator. Only 1 coordinator allowed per club.`
      });
    }
  }
  if (role === 'admin') {
    const existing = await User.countDocuments({
      role: 'admin',
      assignedClubs: clubId
    });
    if (existing >= 2) {
      const club = await Club.findById(clubId).select('name');
      return res.status(409).json({
        message: `Club "${club?.name || clubId}" already has 2 admins. Maximum 2 admins allowed per club.`
      });
    }
  }
}
    }

    const userData = { name, email, password, role: role || 'student' };
    if (!role || role === 'student') {
      userData.enrollment = enrollment.toUpperCase();
    } else {
      userData.loginId       = loginId.toUpperCase();
      userData.assignedClubs = assignedClubs;
    }

    const user = await User.create(userData);
    res.status(201).json({ message: 'Account created successfully', user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'ID and password are required' });

    let user;
    if (!role || role === 'student') {
      user = await User.findOne({ enrollment: identifier.toUpperCase(), role: 'student' })
                       .populate('assignedClubs', 'name category');
    } else {
      user = await User.findOne({ loginId: identifier.toUpperCase(), role })
                       .populate('assignedClubs', 'name category');
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      message: 'Login successful', token,
      user: {
        id: user._id, name: user.name, email: user.email,
        enrollment: user.enrollment, loginId: user.loginId,
        role: user.role, interests: user.interests,
        assignedClubs: user.assignedClubs,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Public clubs list for signup dropdown
router.get('/clubs-list', async (req, res) => {
  try {
    const clubs = await Club.find({}, 'name category').sort({ name: 1 });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching clubs' });
  }
});

module.exports = router;
