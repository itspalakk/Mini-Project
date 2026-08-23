// seed.js — run once: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User         = require('./models/User');
const Club         = require('./models/Club');
const Event        = require('./models/Event');
const Registration = require('./models/Registration');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edueventdb';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Club.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});
  console.log('Cleared existing data');

  // Create clubs first
  const clubs = await Club.insertMany([
    { name: 'Code Crafters',      description: 'Hackathons, open source projects, coding sprints.', category: 'Technology',       memberCount: 48 },
    { name: 'Canvas Collective',  description: 'Fine arts, digital art, street art, mixed media.',  category: 'Arts & Culture',   memberCount: 32 },
    { name: 'Rhythm Nation',      description: 'Jam sessions, live performances, music theory.',    category: 'Music',            memberCount: 27 },
    { name: 'Green Earth Society',description: 'Sustainability drives, tree planting, eco policy.', category: 'Environment',      memberCount: 55 },
    { name: 'Startup Studio',     description: 'Ideate, build, pitch. Entrepreneurship in action.', category: 'Entrepreneurship', memberCount: 40 },
    { name: 'PixelPlay Gaming',   description: 'Competitive gaming, LAN tournaments, esports.',    category: 'Gaming',           memberCount: 63 },
  ]);
  console.log(`Created ${clubs.length} clubs`);

  const hashPw = pw => bcrypt.hash(pw, 10);

  // Admin assigned to Code Crafters + Startup Studio
  const admin = await User.create({
    name: 'Sam Admin', email: 'admin@demo.com',
    loginId: 'ADMIN001', password: await hashPw('admin123'),
    role: 'admin', assignedClubs: [clubs[0]._id, clubs[4]._id],
  });

  // Coordinator 1 — Code Crafters + Gaming
  const coord1 = await User.create({
    name: 'Jordan Coord', email: 'coord1@demo.com',
    loginId: 'COORD001', password: await hashPw('coord123'),
    role: 'coordinator', assignedClubs: [clubs[0]._id, clubs[5]._id],
  });

  // Coordinator 2 — Arts + Music
  const coord2 = await User.create({
    name: 'Maya Coord', email: 'coord2@demo.com',
    loginId: 'COORD002', password: await hashPw('coord456'),
    role: 'coordinator', assignedClubs: [clubs[1]._id, clubs[2]._id],
  });

  // Club Manager
  const manager = await User.create({
    name: 'Chief Manager', email: 'manager@demo.com',
    loginId: 'MANAGER001', password: await hashPw('manager123'),
    role: 'club_manager',
  });

  // Update clubs with coordinator
  await Club.findByIdAndUpdate(clubs[0]._id, { coordinator: coord1._id });
  await Club.findByIdAndUpdate(clubs[1]._id, { coordinator: coord2._id });
  await Club.findByIdAndUpdate(clubs[2]._id, { coordinator: coord2._id });
  await Club.findByIdAndUpdate(clubs[4]._id, { coordinator: admin._id });
  await Club.findByIdAndUpdate(clubs[5]._id, { coordinator: coord1._id });


  // Students
  const students = await User.insertMany([
    { name: 'Alex Student', email: 'student@demo.com', enrollment: 'STU001', password: await hashPw('student123'), role: 'student', interests: ['Technology','Gaming','Entrepreneurship'] },
    { name: 'Priya Sharma',  email: 'priya@demo.com',  enrollment: 'STU002', password: await hashPw('student123'), role: 'student', interests: ['Music','Arts & Culture'] },
    { name: 'Rahul Verma',   email: 'rahul@demo.com',  enrollment: 'STU003', password: await hashPw('student123'), role: 'student', interests: ['Environment','Sports'] },
  ]);
  console.log(`Created ${students.length} students`);

  // Events
  const now = new Date();
  const days = d => new Date(now.getTime() + d * 86400000);
  const events = await Event.insertMany([
    { title: 'Annual Hackathon 2025',    description: '24-hour coding competition.', club: clubs[0]._id, date: days(7),  venue: 'Central Auditorium', createdBy: coord1._id },
    { title: 'Startup Pitch Day',        description: 'Present your idea to mentors.', club: clubs[4]._id, date: days(14), venue: 'Seminar Hall A',    createdBy: admin._id  },
    { title: 'Art Exhibition',           description: 'Showcasing student artworks.', club: clubs[1]._id, date: days(10), venue: 'Gallery Hall B',    createdBy: coord2._id },
    { title: 'Live Music Night',         description: 'Performances by student bands.', club: clubs[2]._id, date: days(5),  venue: 'Open Air Theatre',  createdBy: coord2._id },
    { title: 'Gaming Tournament S3',     description: 'Valorant & FIFA, prizes!', club: clubs[5]._id, date: days(12), venue: 'Computer Lab 2',    createdBy: coord1._id },
    { title: 'Eco-Campus Drive',         description: 'Tree planting initiative.', club: clubs[3]._id, date: days(3),  venue: 'Campus Grounds',    createdBy: admin._id  },
  ]);
  console.log(`Created ${events.length} events`);

  // Sample pending registrations from students
  await Registration.insertMany([
    { user: students[0]._id, type: 'club',  club:  clubs[0]._id, status: 'pending' },
    { user: students[0]._id, type: 'event', event: events[0]._id, status: 'pending' },
    { user: students[1]._id, type: 'club',  club:  clubs[1]._id, status: 'pending' },
    { user: students[2]._id, type: 'club',  club:  clubs[3]._id, status: 'approved' },
  ]);
  console.log('Created sample registrations');

  console.log('\n Demo Credentials');
  console.log('─────────────────────────────────────────');
  console.log('STUDENT      → Enrollment: STU001  | Password: student123');
  console.log('ADMIN        → Login ID:   ADMIN001 | Password: admin123   | Clubs: Code Crafters, Startup Studio');
  console.log('COORDINATOR1 → Login ID:   COORD001 | Password: coord123   | Clubs: Code Crafters, PixelPlay Gaming');
  console.log('COORDINATOR2 → Login ID:   COORD002 | Password: coord456   | Clubs: Canvas Collective, Rhythm Nation');
  console.log('MANAGER      → Login ID:   MANAGER001 | Password: manager123');
  console.log('─────────────────────────────────────────\n');


  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
