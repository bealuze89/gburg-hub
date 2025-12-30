const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

let didLogEmailConfig = false;
let cachedResendClient = null;

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

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const hasKey = typeof apiKey === "string" && apiKey.trim().length > 0;

  // Log once per process (no secrets).
  if (!didLogEmailConfig) {
    didLogEmailConfig = true;
    console.log(`[email] provider=resend configured=${hasKey}`);
  }

  if (!hasKey) return null;
  if (!cachedResendClient) {
    cachedResendClient = new Resend(apiKey.trim());
  }
  return cachedResendClient;
}

async function sendVerificationCode(email, code) {
  try {
    const resend = getResendClient();

    const stamp = new Date().toISOString();
    const devLine = `[${stamp}] Verification code for ${email}: ${code}`;

    // DEV MODE: no provider credentials → just log the code
    if (!resend) {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
      appendDevLog(devLine);
      return;
    }

    const from = process.env.MAIL_FROM;
    if (!from || typeof from !== "string" || !from.trim()) {
      throw new Error("MAIL_FROM is not configured");
    }

    await resend.emails.send({
      from: from.trim(),
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
    const resend = getResendClient();

    const safeTitle = typeof title === "string" ? title.trim() : "your listing";
    const safeDaysLeft = Number.isFinite(Number(daysLeft)) ? Number(daysLeft) : 1;

    if (!resend) {
      console.log(
        `[DEV MODE] Expiry warning to ${email}: Listing #${listingId} (${safeTitle}) expires in ${safeDaysLeft} day(s).`
      );
      return;
    }

    const from = process.env.MAIL_FROM;
    if (!from || typeof from !== "string" || !from.trim()) {
      throw new Error("MAIL_FROM is not configured");
    }

    await resend.emails.send({
      from: from.trim(),
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
