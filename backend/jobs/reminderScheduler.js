// jobs/reminderScheduler.js
// EduEvent Manager — Pre-event reminder scheduler (24h + 2h before an event)
//
// Control via environment variables (backend/.env):
//   REMINDERS_ENABLED      (default "true")  — set to "false" to disable the scheduler
//   REMINDER_CRON_SCHEDULE  (default "*/5 * * * *") — how often the eligibility check runs
//
// Design:
//   - Only registrations with type "event" AND status "approved" are eligible.
//   - A registration is atomic-claimed (reminderXSentAt set from null) BEFORE the email
//     is sent, so overlapping job ticks can never send a duplicate reminder.
//   - If the email fails, the claim is rolled back so the next tick retries.
//   - If an event was deleted/cancelled, the populated event is null and the job
//     silently skips that registration.

const cron          = require('node-cron');
const Event         = require('../models/Event');
const User          = require('../models/User');
const Registration  = require('../models/Registration');
const { sendEventReminderEmail } = require('../utils/sendEmail');

const DEFAULT_SCHEDULE = '*/5 * * * *';

/** Difference (in hours) between now and a given date. Positive = future. */
function hoursUntil(date) {
  return (new Date(date).getTime() - Date.now()) / 3600000;
}

/**
 * One reminder pass for a given offset (24h or 2h) within a ±windowMinutes window.
 * Returns the number of reminder emails successfully sent.
 */
async function sendRemindersFor({ field, hoursBefore, windowMinutes }) {
  const now = new Date();

  const eligible = await Registration.find({
    type: 'event',
    status: 'approved',
    [field]: null, // never re-send an already-sent reminder
  })
    .populate({
      path: 'event',
      select: 'title date venue club',
      populate: { path: 'club', select: 'name' },
    })
    .populate('user', 'name email');

  let sent = 0;

  for (const reg of eligible) {
    // Skip registrations whose event was deleted/cancelled (populate is null)
    if (!reg.event || !reg.user || !reg.user.email) continue;

    const diff = hoursUntil(reg.event.date);

    // Only act inside the ±30-minute eligibility window around the exact offset
    const halfWindowHrs = windowMinutes / 60;
    if (diff <= hoursBefore - halfWindowHrs || diff >= hoursBefore + halfWindowHrs) continue;

    // Atomically claim this registration so concurrent ticks cannot double-send
    const claimed = await Registration.updateOne(
      { _id: reg._id, [field]: null },
      { $set: { [field]: now } }
    );
    if (claimed.matchedCount === 0) continue; // someone else claimed it

    let info = null;
    try {
      info = await sendEventReminderEmail({
        to:          reg.user.email,
        studentName: reg.user.name,
        eventName:   reg.event.title,
        eventDate:   reg.event.date,
        eventVenue:  reg.event.venue,
        clubName:    reg.event.club?.name || 'Unknown',
        hoursBefore,
      });
    } catch (err) {
      console.error('❌ [Reminders] Send error:', err.message);
      info = null;
    }

    if (!info) {
      // Roll back the claim so the reminder is retried on the next tick
      await Registration.updateOne(
        { _id: reg._id },
        { $set: { [field]: null } }
      );
      continue;
    }

    sent++;
  }

  return sent;
}

/**
 * Run one full reminder pass (24h reminders, then 2h reminders).
 * Used both by the cron scheduler and for manual/testing invocations.
 */
async function runReminderCheck() {
  try {
    const s24 = await sendRemindersFor({
      field: 'reminder24hSentAt',
      hoursBefore: 24,
      windowMinutes: 30,
    });
    const s2 = await sendRemindersFor({
      field: 'reminder2hSentAt',
      hoursBefore: 2,
      windowMinutes: 30,
    });

    if (s24 + s2 > 0) {
      console.log(`⏰ [Reminders] Sent 24h=${s24} 2h=${s2}`);
    }
    return { '24h': s24, '2h': s2 };
  } catch (err) {
    console.error('❌ [Reminders] runReminderCheck failed:', err.message);
    return { '24h': 0, '2h': 0 };
  }
}

/**
 * Start the recurring cron scheduler. Called once from server.js after MongoDB
 * is connected. No-op (with a log) when REMINDERS_ENABLED=false.
 */
function startReminderScheduler() {
  const enabled = (process.env.REMINDERS_ENABLED ?? 'true') !== 'false';

  if (!enabled) {
    console.log('⏰ [Reminders] Scheduler disabled (REMINDERS_ENABLED=false)');
    return;
  }

  const schedule = process.env.REMINDER_CRON_SCHEDULE || DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`❌ [Reminders] Invalid REMINDER_CRON_SCHEDULE: "${schedule}"`);
    return;
  }

  cron.schedule(schedule, runReminderCheck);
  console.log(`⏰ [Reminders] Scheduler started (cron="${schedule}")`);
}

module.exports = { runReminderCheck, startReminderScheduler, hoursUntil };