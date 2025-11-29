const nodemailer = require('nodemailer');

// Support multiple env var naming conventions so existing .env values are accepted.
// Priority: explicit SMTP_* vars, then EMAIL_* vars.
let SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST;
let SMTP_PORT = process.env.SMTP_PORT || process.env.EMAIL_PORT;
let SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
let SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'no-reply@example.com';

let transporter = null;

// If user provided credentials but not host/port, try a small heuristic for Gmail
if ((SMTP_USER && SMTP_PASS) && !(SMTP_HOST && SMTP_PORT)) {
  if (SMTP_USER.endsWith('@gmail.com')) {
    SMTP_HOST = SMTP_HOST || 'smtp.gmail.com';
    SMTP_PORT = SMTP_PORT || '465';
    console.warn('SMTP host/port not provided — assuming Gmail SMTP defaults because EMAIL_USER is @gmail.com.');
  }
}

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: String(SMTP_PORT) === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
} else {
  console.warn('SMTP not fully configured. Emails will be logged to console. Provide SMTP_HOST/PORT/USER/PASS or EMAIL_USER/EMAIL_PASS (+ optional EMAIL_HOST/EMAIL_PORT) to enable sending.');
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    // SMTP not configured — simulate send without noisy console output
    return { simulated: true, to, subject };
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html
  });

  return info;
}

module.exports = { sendEmail };
