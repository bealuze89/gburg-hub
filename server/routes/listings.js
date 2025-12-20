const express = require("express");

const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function requireVerifiedUser(req, res, next) {
	db.get(`SELECT is_verified FROM users WHERE id = ?`, [req.userId], (err, row) => {
		if (err) return res.status(500).json({ error: "Database error." });
		if (!row) return res.status(401).json({ error: "User not found." });
		if (row.is_verified !== 1) return res.status(403).json({ error: "Email not verified." });
		return next();
	});
}

// PUBLIC
// GET /api/listings - Return all listings (no contact info)
router.get("/listings", (req, res) => {
	db.all(
		`SELECT id, title, description, price, user_id, created_at FROM listings ORDER BY datetime(created_at) DESC`,
		[],
		(err, rows) => {
			if (err) return res.status(500).json({ error: "Database error." });
			return res.json(rows || []);
		}
	);
});

// PROTECTED
// POST /api/listings - Create a listing (verified users only)
router.post("/listings", authMiddleware, requireVerifiedUser, (req, res) => {
	const { title, description, price, contact } = req.body || {};

	if (!title || typeof title !== "string") {
		return res.status(400).json({ error: "Title is required." });
	}
	if (!description || typeof description !== "string") {
		return res.status(400).json({ error: "Description is required." });
	}
	if (price === undefined || price === null || Number.isNaN(Number(price))) {
		return res.status(400).json({ error: "Price is required." });
	}
	if (!contact || typeof contact !== "string") {
		return res.status(400).json({ error: "Contact is required." });
	}

	const normalizedTitle = title.trim();
	const normalizedDescription = description.trim();
	const normalizedContact = contact.trim();
	const normalizedPrice = Number(price);

	if (!normalizedTitle) return res.status(400).json({ error: "Title is required." });
	if (!normalizedDescription) return res.status(400).json({ error: "Description is required." });
	if (!normalizedContact) return res.status(400).json({ error: "Contact is required." });
	if (normalizedPrice < 0) return res.status(400).json({ error: "Price must be non-negative." });

	db.run(
		`INSERT INTO listings (title, description, price, contact, user_id) VALUES (?, ?, ?, ?, ?)`,
		[normalizedTitle, normalizedDescription, normalizedPrice, normalizedContact, req.userId],
		function (err) {
			if (err) return res.status(500).json({ error: "Database error." });
			return res.status(201).json({ message: "Listing created.", id: this.lastID });
		}
	);
});

// GET /api/mylistings - Return listings created by logged-in user (verified users only)
router.get("/mylistings", authMiddleware, requireVerifiedUser, (req, res) => {
	db.all(
		`SELECT id, title, description, price, contact, user_id, created_at FROM listings WHERE user_id = ? ORDER BY datetime(created_at) DESC`,
		[req.userId],
		(err, rows) => {
			if (err) return res.status(500).json({ error: "Database error." });
			return res.json(rows || []);
		}
	);
});

// GET /api/listings/:id/contact - Return only contact field (verified users only)
router.get("/listings/:id/contact", authMiddleware, requireVerifiedUser, (req, res) => {
	const listingId = Number(req.params.id);
	if (!Number.isInteger(listingId)) return res.status(400).json({ error: "Invalid listing id." });

	db.get(`SELECT contact FROM listings WHERE id = ?`, [listingId], (err, row) => {
		if (err) return res.status(500).json({ error: "Database error." });
		if (!row) return res.status(404).json({ error: "Listing not found." });
		return res.json({ contact: row.contact });
	});
});

// DELETE /api/listings/:id - Only owner can delete
router.delete("/listings/:id", authMiddleware, (req, res) => {
	const listingId = Number(req.params.id);
	if (!Number.isInteger(listingId)) return res.status(400).json({ error: "Invalid listing id." });

	db.get(`SELECT id, user_id FROM listings WHERE id = ?`, [listingId], (err, row) => {
		if (err) return res.status(500).json({ error: "Database error." });
		if (!row) return res.status(404).json({ error: "Listing not found." });
		if (row.user_id !== req.userId) return res.status(403).json({ error: "Forbidden." });

		db.run(`DELETE FROM listings WHERE id = ?`, [listingId], (err2) => {
			if (err2) return res.status(500).json({ error: "Database error." });
			return res.json({ message: "Listing deleted." });
		});
	});
});

module.exports = router;
