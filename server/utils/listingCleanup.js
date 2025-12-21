const fs = require("fs");
const path = require("path");

const db = require("../db");
const { sendListingExpiryWarning } = require("./email");

const uploadsDir = path.join(__dirname, "..", "uploads");

function deleteImageIfStored(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) return resolve();
    const filename = imageUrl.replace("/uploads/", "");
    const filePath = path.join(uploadsDir, filename);
    fs.unlink(filePath, () => resolve());
  });
}

function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row);
    });
  });
}

function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows || []);
    });
  });
}

function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });
}

async function deleteListingById(listingId) {
  const row = await dbGet(`SELECT image_url as imageUrl FROM listings WHERE id = ?`, [listingId]);
  await dbRun(`DELETE FROM listings WHERE id = ?`, [listingId]);
  await deleteImageIfStored(row?.imageUrl);
}

async function runListingCleanup() {
  // 1) Warn active listings that will expire soon (29-30 days old), once.
  const toWarn = await dbAll(
    `SELECT l.id as id, l.title as title, l.user_id as userId
     FROM listings l
     WHERE COALESCE(l.status, 'active') != 'sold'
       AND l.expiry_warned_at IS NULL
       AND datetime(l.created_at) <= datetime('now', '-29 days')
       AND datetime(l.created_at) > datetime('now', '-30 days')`,
    []
  );

  for (const listing of toWarn) {
    const user = await dbGet(`SELECT email FROM users WHERE id = ?`, [listing.userId]);
    if (user?.email) {
      await sendListingExpiryWarning(user.email, { title: listing.title, listingId: listing.id, daysLeft: 1 });
    }
    await dbRun(`UPDATE listings SET expiry_warned_at = CURRENT_TIMESTAMP WHERE id = ?`, [listing.id]);
  }

  // 2) Delete sold listings after 7 days.
  const soldExpired = await dbAll(
    `SELECT id FROM listings
     WHERE COALESCE(status, 'active') = 'sold'
       AND sold_at IS NOT NULL
       AND datetime(sold_at) <= datetime('now', '-7 days')`,
    []
  );

  for (const row of soldExpired) {
    await deleteListingById(row.id);
  }

  // 3) Delete active listings after 30 days.
  const activeExpired = await dbAll(
    `SELECT id FROM listings
     WHERE COALESCE(status, 'active') != 'sold'
       AND datetime(created_at) <= datetime('now', '-30 days')`,
    []
  );

  for (const row of activeExpired) {
    await deleteListingById(row.id);
  }

  return {
    warned: toWarn.length,
    deletedSold: soldExpired.length,
    deletedActive: activeExpired.length,
  };
}

module.exports = { runListingCleanup };
