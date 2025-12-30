const express = require("express");

const db = require("../db");

const router = express.Router();

// TEMP DEBUG
// GET /api/debug/db
// Returns: total number of listings, total number of users, newest listing created_at
router.get("/db", (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM listings`, [], (err, listingsRow) => {
    if (err) return res.status(500).json({ error: "Database error." });

    db.get(`SELECT COUNT(*) as count FROM users`, [], (err2, usersRow) => {
      if (err2) return res.status(500).json({ error: "Database error." });

      db.get(
        `SELECT created_at as createdAt
         FROM listings
         ORDER BY datetime(created_at) DESC
         LIMIT 1`,
        [],
        (err3, newestRow) => {
          if (err3) return res.status(500).json({ error: "Database error." });

          return res.json({
            listingsCount: Number(listingsRow?.count || 0),
            usersCount: Number(usersRow?.count || 0),
            newestListingCreatedAt: newestRow?.createdAt || null,
          });
        }
      );
    });
  });
});

module.exports = router;
