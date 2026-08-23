// utils/sendEmail.js
const nodemailer = require('nodemailer');

// Helper to create transporter based on env vars or dev mode
async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  const cleanPass = pass ? pass.replace(/\s+/g, '') : '';
  const isPlaceholder = !user || user.includes('your_') || !cleanPass || cleanPass.includes('your_');

  if (host && user && cleanPass && !isPlaceholder) {
    console.log(`📧 [Nodemailer] Real SMTP Configured with host: ${host}, user: ${user}`);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass: cleanPass },
    });
  }

  // Fallback to ethereal test account for development/testing if no SMTP provided
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('💡 [Nodemailer] Dev Mode: No real SMTP credentials set in backend/.env.');
    console.log('💡 [Nodemailer] Using Ethereal test inbox. To send to real Gmail inboxes, put your real Gmail & App Password in backend/.env.');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.warn('⚠️ [Nodemailer] Could not create Ethereal test account:', err.message);
    return null;
  }
}

/**
 * Send Email Notification on Registration Approval / Rejection
 * @param {Object} opts
 * @param {string} opts.to - Student email address
 * @param {string} opts.studentName - Student name
 * @param {string} opts.type - 'club' or 'event'
 * @param {string} opts.name - Club name or Event title
 * @param {string} opts.status - 'approved' or 'rejected'
 * @param {string} [opts.message] - Coordinator's message/feedback
 * @param {Date|string} [opts.eventDate] - Event date if applicable
 * @param {string} [opts.eventVenue] - Event location/venue if applicable
 */
async function sendRegistrationStatusEmail({
  to,
  studentName,
  type,
  name,
  status,
  message,
  eventDate,
  eventVenue,
}) {
  try {
    if (!to) {
      console.warn('⚠️ [Nodemailer] No recipient email address provided.');
      return null;
    }

    const transporter = await createTransporter();
    if (!transporter) {
      console.warn('⚠️ [Nodemailer] Transporter initialization failed.');
      return null;
    }

    const isApproved = status.toLowerCase() === 'approved';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    const statusColor = isApproved ? '#22c55e' : '#ef4444';
    const statusBg = isApproved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const itemTypeLabel = type === 'club' ? 'Club' : 'Event';

    const formattedDate = eventDate ? new Date(eventDate).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : null;

    const subject = `[EduEvent] Your ${itemTypeLabel} Registration Request Has Been ${statusText}`;

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 30px; }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: 800; color: #f0a500; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 10px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}; margin-top: 10px; text-transform: uppercase; }
          .details-card { background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #1e293b; font-size: 14px; }
          .detail-label { color: #94a3b8; font-weight: 600; }
          .detail-val { color: #f8fafc; font-weight: 600; text-align: right; }
          .message-box { background: rgba(240, 165, 0, 0.08); border-left: 4px solid #f0a500; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .message-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #f0a500; font-weight: 700; margin-bottom: 6px; }
          .message-text { color: #e2e8f0; font-size: 14px; line-height: 1.5; font-style: italic; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">EduEvent Manager</div>
            <div class="title">Registration Status Update</div>
            <div class="badge">${statusText}</div>
          </div>

          <p>Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p>Your registration status for the following ${itemTypeLabel.toLowerCase()} has been updated by the coordinator/admin:</p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-val">${itemTypeLabel} Registration</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${itemTypeLabel} Name:</span>
              <span class="detail-val">${name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-val" style="color:${statusColor}">${statusText}</span>
            </div>
            ${type === 'event' && formattedDate ? `
            <div class="detail-row">
              <span class="detail-label">Event Date:</span>
              <span class="detail-val">${formattedDate}</span>
            </div>
            ` : ''}
            ${type === 'event' && eventVenue ? `
            <div class="detail-row">
              <span class="detail-label">Venue / Location:</span>
              <span class="detail-val">${eventVenue}</span>
            </div>
            ` : ''}
          </div>

          ${message ? `
          <div class="message-box">
            <div class="message-title">Message from Coordinator</div>
            <div class="message-text">"${message}"</div>
          </div>
          ` : ''}

          <p style="font-size:14px; color:#cbd5e1;">You can log in to your EduEvent account anytime to view your updated registrations and dashboard.</p>

          <div class="footer">
            © ${new Date().getFullYear()} EduEvent Manager. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text alternative
    const textContent = `
Hello ${studentName || 'Student'},

Your registration request for ${itemTypeLabel} "${name}" has been ${statusText.toUpperCase()}.

Registration Details:
- Type: ${itemTypeLabel}
- Name: ${name}
- Status: ${statusText}
${type === 'event' && formattedDate ? `- Event Date: ${formattedDate}\n` : ''}${type === 'event' && eventVenue ? `- Venue: ${eventVenue}\n` : ''}${message ? `\nMessage from Coordinator:\n"${message}"\n` : ''}
Thank you,
EduEvent Manager Team
    `.trim();

    const fromAddress = process.env.EMAIL_FROM || '"EduEvent Manager" <noreply@eduevent.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`📧 [Nodemailer] Sent status email to ${to}. MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 [Nodemailer] Ethereal Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('❌ [Nodemailer] Error sending email:', err.message);
    return null;
  }
}

/**
 * Send Email Confirmation immediately after a successful Event Registration
 * @param {Object} opts
 * @param {string} opts.to - Student email address
 * @param {string} opts.studentName - Student name
 * @param {string} opts.eventName - Event title
 * @param {Date|string} opts.eventDate - Event date (stored as MongoDB Date)
 * @param {string} opts.eventVenue - Event venue/location
 * @param {string} opts.clubName - Name of the club hosting the event
 */
async function sendEventRegistrationConfirmationEmail({
  to,
  studentName,
  eventName,
  eventDate,
  eventVenue,
  clubName,
}) {
  try {
    if (!to) {
      console.warn('⚠️ [Nodemailer] No recipient email address provided.');
      return null;
    }

    // Reuse the same transporter/SMTP configuration as the existing status email
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn('⚠️ [Nodemailer] Transporter initialization failed.');
      return null;
    }

    // Format date/time in Asia/Kolkata (Medi-Caps University, India)
    const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : null;

    const formattedTime = eventDate ? new Date(eventDate).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase() : null;

    const subject = `Event Registration Confirmed — ${eventName}`;

    // HTML Email Template — styled like the existing registration status email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 30px; }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: 800; color: #f0a500; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 10px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 700; color: #f0a500; background: rgba(240, 165, 0, 0.08); border: 1px solid #f0a500; margin-top: 10px; text-transform: uppercase; }
          .details-card { background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #1e293b; font-size: 14px; }
          .detail-label { color: #94a3b8; font-weight: 600; }
          .detail-val { color: #f8fafc; font-weight: 600; text-align: right; }
          .status-box { background: rgba(240, 165, 0, 0.08); border-left: 4px solid #f0a500; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .status-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #f0a500; font-weight: 700; margin-bottom: 6px; }
          .status-text { color: #e2e8f0; font-size: 14px; line-height: 1.5; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px; }
        </style>
      </head>
      <body>
      <div class="container">
          <div class="header">
            <div class="brand">EduEvent Manager</div>
            <div class="title">Event Registration Confirmed</div>
            <div class="badge">Pending Approval</div>
          </div>

          <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
          <p>Your registration for the following event has been successfully received.</p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Event Name:</span>
              <span class="detail-val">${eventName}</span>
            </div>
            ${formattedDate ? `
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-val">${formattedDate}</span>
            </div>
            ` : ''}
            ${formattedTime ? `
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-val">${formattedTime}</span>
            </div>
            ` : ''}
            ${eventVenue ? `
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-val">${eventVenue}</span>
            </div>
            ` : ''}
            ${clubName ? `
            <div class="detail-row">
              <span class="detail-label">Club:</span>
              <span class="detail-val">${clubName}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-val">Registration Pending Approval</span>
            </div>
          </div>

          <div class="status-box">
            <div class="status-title">Next Steps</div>
            <div class="status-text">Please wait for the event coordinator/admin to review your registration. You will receive another email when your registration is approved or rejected.</div>
          </div>

          <p style="font-size:14px; color:#cbd5e1;">You can log in to your EduEvent account anytime to view your registrations and dashboard.</p>

          <div class="footer">
            Regards,<br>
            EduEvent Manager<br>
            Medi-Caps University<br>
            © ${new Date().getFullYear()} EduEvent Manager. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text alternative
    const textContent = `
Dear ${studentName || 'Student'},

Your registration for the following event has been successfully received.

Event Details:
- Event Name: ${eventName}
${formattedDate ? `- Date: ${formattedDate}\n` : ''}${formattedTime ? `- Time: ${formattedTime}\n` : ''}${eventVenue ? `- Venue: ${eventVenue}\n` : ''}${clubName ? `- Club: ${clubName}\n` : ''}
Status:
Registration Pending Approval

Please wait for the event coordinator/admin to review your registration.
You will receive another email when your registration is approved or rejected.

Regards,
EduEvent Manager
Medi-Caps University
    `.trim();

    const fromAddress = process.env.EMAIL_FROM || '"EduEvent Manager" <noreply@eduevent.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`📧 [Nodemailer] Sent event registration confirmation email to ${to}. MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 [Nodemailer] Ethereal Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('❌ [Nodemailer] Error sending confirmation email:', err.message);
    return null;
  }
}

/**
 * Send a pre-event Reminder Email to an approved registrant (24h or 2h before an event)
 * @param {Object} opts
 * @param {string} opts.to - Student email address
 * @param {string} opts.studentName - Student name
 * @param {string} opts.eventName - Event title
 * @param {Date|string} opts.eventDate - Event date (stored as MongoDB Date)
 * @param {string} opts.eventVenue - Event venue/location
 * @param {string} opts.clubName - Name of the club hosting the event
 * @param {number} opts.hoursBefore - 24 or 2 (how far before the event this reminder is)
 */
async function sendEventReminderEmail({
  to,
  studentName,
  eventName,
  eventDate,
  eventVenue,
  clubName,
  hoursBefore,
}) {
  try {
    if (!to) {
      console.warn('⚠️ [Nodemailer] No recipient email address provided.');
      return null;
    }

    // Reuse the same transporter/SMTP configuration as the existing emails
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn('⚠️ [Nodemailer] Transporter initialization failed.');
      return null;
    }

    // Format date/time in Asia/Kolkata (Medi-Caps University, India)
    const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : null;

    const formattedTime = eventDate ? new Date(eventDate).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase() : null;

    const badgeText = hoursBefore === 2 ? '2 HOURS TO GO' : 'STARTING TOMORROW';
    const subject = `Event Reminder — ${eventName}`;

    // HTML Email Template — styled like the existing project emails
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 30px; }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: 800; color: #f0a500; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 10px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 700; color: #f0a500; background: rgba(240, 165, 0, 0.08); border: 1px solid #f0a500; margin-top: 10px; text-transform: uppercase; }
          .details-card { background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #1e293b; font-size: 14px; }
          .detail-label { color: #94a3b8; font-weight: 600; }
          .detail-val { color: #f8fafc; font-weight: 600; text-align: right; }
          .note-box { background: rgba(240, 165, 0, 0.08); border-left: 4px solid #f0a500; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .note-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #f0a500; font-weight: 700; margin-bottom: 6px; }
          .note-text { color: #e2e8f0; font-size: 14px; line-height: 1.5; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px; }
        </style>
      </head>
      <body>
      <div class="container">
          <div class="header">
            <div class="brand">EduEvent Manager</div>
            <div class="title">Event Reminder</div>
            <div class="badge">${badgeText}</div>
          </div>

          <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
          <p>This is a friendly reminder that you are registered for the following event:</p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Event Name:</span>
              <span class="detail-val">${eventName}</span>
            </div>
            ${formattedDate ? `
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-val">${formattedDate}</span>
            </div>
            ` : ''}
            ${formattedTime ? `
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-val">${formattedTime}</span>
            </div>
            ` : ''}
            ${eventVenue ? `
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-val">${eventVenue}</span>
            </div>
            ` : ''}
            ${clubName ? `
            <div class="detail-row">
              <span class="detail-label">Club:</span>
              <span class="detail-val">${clubName}</span>
            </div>
            ` : ''}
          </div>

          <div class="note-box">
            <div class="note-title">Get Ready</div>
            <div class="note-text">Your registration for this event has been approved. We look forward to seeing you there!</div>
          </div>

          <p style="font-size:14px; color:#cbd5e1;">You can log in to your EduEvent account anytime to view your registrations and dashboard.</p>

          <div class="footer">
            Regards,<br>
            EduEvent Manager<br>
            Medi-Caps University<br>
            © ${new Date().getFullYear()} EduEvent Manager. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text alternative
    const textContent = `
Dear ${studentName || 'Student'},

This is a friendly reminder that you are registered for the following event:

Event Details:
- Event Name: ${eventName}
${formattedDate ? `- Date: ${formattedDate}\n` : ''}${formattedTime ? `- Time: ${formattedTime}\n` : ''}${eventVenue ? `- Venue: ${eventVenue}\n` : ''}${clubName ? `- Club: ${clubName}\n` : ''}

Your registration for this event has been approved. We look forward to seeing you there!

Regards,
EduEvent Manager
Medi-Caps University
    `.trim();

    const fromAddress = process.env.EMAIL_FROM || '"EduEvent Manager" <noreply@eduevent.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`📧 [Nodemailer] Sent event reminder email to ${to}. MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 [Nodemailer] Ethereal Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('❌ [Nodemailer] Error sending reminder email:', err.message);
    return null;
  }
}

module.exports = { sendRegistrationStatusEmail, sendEventRegistrationConfirmationEmail, sendEventReminderEmail };
