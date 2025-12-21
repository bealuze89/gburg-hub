const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

function getDevLogPath() {
  const configured = process.env.VERIFICATION_LOG_PATH;
  if (configured && String(configured).trim()) return String(configured).trim();
  // Default: keep it easy to find inside the repo.
  // User-requested filename (no extension): server/verifiction
  return path.join(__dirname, "..", "verifiction");
}

function appendDevLog(line) {
  try {
    fs.appendFileSync(getDevLogPath(), `${line}\n`, { encoding: "utf8" });
  } catch (_) {
    // Never crash the server because file logging failed.
  }
}

function makeTransporter() {
  if (
    !process.env.MAIL_HOST ||
    !process.env.MAIL_USER ||
    !process.env.MAIL_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

async function sendVerificationCode(email, code) {
  try {
    const transporter = makeTransporter();

    const stamp = new Date().toISOString();
    const devLine = `[${stamp}] Verification code for ${email}: ${code}`;

    // DEV MODE: no email credentials → just log the code
    if (!transporter) {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
      appendDevLog(devLine);
      return;
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your Burg Market verification code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
  } catch (err) {
    // CRITICAL: never crash the server because email failed
    console.error("Email sending failed (non-fatal):", err.message);
    console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
    const stamp = new Date().toISOString();
    appendDevLog(`[${stamp}] Verification code for ${email}: ${code}`);
  }
}

async function sendListingExpiryWarning(email, { title, listingId, daysLeft }) {
  try {
    const transporter = makeTransporter();

    const safeTitle = typeof title === "string" ? title.trim() : "your listing";
    const safeDaysLeft = Number.isFinite(Number(daysLeft)) ? Number(daysLeft) : 1;

    if (!transporter) {
      console.log(
        `[DEV MODE] Expiry warning to ${email}: Listing #${listingId} (${safeTitle}) expires in ${safeDaysLeft} day(s).`
      );
      return;
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your Burg Market listing will expire soon",
      text:
        `Hi!\n\n` +
        `Your listing "${safeTitle}" will expire in about ${safeDaysLeft} day(s) and will be automatically removed if it is not marked sold.\n\n` +
        `If it has sold, please mark it as sold in My Listings.\n\n` +
        `— Burg Market`,
    });
  } catch (err) {
    console.error("Expiry warning email failed (non-fatal):", err.message);
    console.log(`[DEV MODE] Expiry warning to ${email}: listing expires soon.`);
  }
}

module.exports = { sendVerificationCode, sendListingExpiryWarning };
