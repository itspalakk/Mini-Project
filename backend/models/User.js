// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  // enrollment only for students
  enrollment:    { type: String, sparse: true, uppercase: true },
  // loginId used by admin/coordinator (unique staff ID)
  loginId:       { type: String, sparse: true, uppercase: true },
  password:      { type: String, required: true, minlength: 6 },
  role:          { type: String, enum: ['student', 'coordinator', 'admin'], default: 'student' },
  interests:     [{ type: String }],
  // clubs this admin/coordinator is assigned to
  assignedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
  createdAt:     { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
