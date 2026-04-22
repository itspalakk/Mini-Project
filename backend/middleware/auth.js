// middleware/auth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'eduevent_secret_key_2025';

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorised — no token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user so assignedClubs is always current
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    // Expose assignedClubs as plain string array for easy comparison
    req.user = {
      id:            String(user._id),
      name:          user.name,
      role:          user.role,
      enrollment:    user.enrollment,
      loginId:       user.loginId,
      assignedClubs: (user.assignedClubs || []).map(String),
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Access denied — insufficient permissions' });
    next();
  };
}

module.exports = { protect, roleGuard };
