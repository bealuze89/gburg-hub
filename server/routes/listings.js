const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
try {
	fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
	// non-fatal
}

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => cb(null, uploadsDir),
		filename: (req, file, cb) => {
			const ext = path.extname(file.originalname || "").toLowerCase();
			const safeExt = ext && ext.length <= 10 ? ext : "";
			cb(null, `listing_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`);
		},
	}),
	limits: { fileSize: 8 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const ok = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
		cb(ok ? null : new Error("Only image uploads are allowed."), ok);
	},
});

function absoluteUrl(req, maybePath) {
	if (!maybePath || typeof maybePath !== "string") return null;
	const value = maybePath.trim();
	if (!value) return null;
	if (/^https?:\/\//i.test(value)) return value;
	if (value.startsWith("/")) return `${req.protocol}://${req.get("host")}${value}`;
	return `${req.protocol}://${req.get("host")}/${value}`;
}

function normalizeStatus(value) {
	const v = typeof value === "string" ? value.trim().toLowerCase() : "";
	return v === "sold" ? "sold" : "active";
}

function deleteListingAndImageById(listingId, cb) {
	db.get(`SELECT image_url FROM listings WHERE id = ?`, [listingId], (err, row) => {
		if (err) return cb(err);
		const imageUrl = row?.image_url;
		db.run(`DELETE FROM listings WHERE id = ?`, [listingId], (err2) => {
			if (err2) return cb(err2);
			if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("/uploads/")) {
				const filename = imageUrl.replace("/uploads/", "");
				const filePath = path.join(uploadsDir, filename);
				fs.unlink(filePath, () => cb(null));
				return;
			}
			return cb(null);
		});
	});
}

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
		`SELECT id,
			title,
			description,
			price,
			image_url as imageUrl,
			COALESCE(status, 'active') as status,
			sold_at as soldAt,
			user_id as userId,
			created_at as createdAt
		FROM listings
		ORDER BY datetime(created_at) DESC`,
		[],
		(err, rows) => {
			if (err) return res.status(500).json({ error: "Database error." });
			const mapped = (rows || []).map((r) => ({
				...r,
				imageUrl: absoluteUrl(req, r.imageUrl),
				status: normalizeStatus(r.status),
			}));
			return res.json(mapped);
		}
	);
});

// PROTECTED
// POST /api/listings - Create a listing (verified users only)
router.post("/listings", authMiddleware, requireVerifiedUser, upload.single("image"), (req, res) => {
	const { title, description, price, contactMethod, contactValue } = req.body || {};

	if (!title || typeof title !== "string") {
		return res.status(400).json({ error: "Title is required." });
	}
	if (description !== undefined && description !== null && typeof description !== "string") {
		return res.status(400).json({ error: "Invalid description." });
	}
	if (typeof description === "string" && description.length > 100) {
		return res.status(400).json({ error: "Description must be 100 characters or less." });
	}
	if (price === undefined || price === null || Number.isNaN(Number(price))) {
		return res.status(400).json({ error: "Price is required." });
	}
	if (!req.file) {
		return res.status(400).json({ error: "Image is required." });
	}

	const normalizedMethod = typeof contactMethod === "string" ? contactMethod.trim().toLowerCase() : "email";
	const allowedMethods = new Set(["email", "phone", "instagram"]);
	if (!allowedMethods.has(normalizedMethod)) {
		return res.status(400).json({ error: "Invalid contact method." });
	}

	const normalizedTitle = title.trim();
	const normalizedDescription = typeof description === "string" ? description.trim() : "";
	const normalizedPrice = Number(price);
	const normalizedContactValue = typeof contactValue === "string" ? contactValue.trim() : "";
	const storedImagePath = `/uploads/${req.file.filename}`;

	if (!normalizedTitle) return res.status(400).json({ error: "Title is required." });
	if (normalizedPrice < 0) return res.status(400).json({ error: "Price must be non-negative." });
	if (normalizedMethod !== "email" && !normalizedContactValue) {
		return res.status(400).json({ error: "Contact value is required." });
	}
	if (normalizedMethod === "phone") {
		const ok = /^\d+$/.test(normalizedContactValue);
		if (!ok) return res.status(400).json({ error: "Phone must contain digits only." });
	}

	function computeContactDisplay(method, value) {
		if (method === "email") return value;
		if (method === "phone") return value;
		if (method === "instagram") {
			if (!value) return "";
			return value.startsWith("@") ? value : `@${value}`;
		}
		return value;
	}

	if (normalizedMethod === "email") {
		// Email contact defaults to user's school email.
		db.get(`SELECT email FROM users WHERE id = ?`, [req.userId], (err, row) => {
			if (err) return res.status(500).json({ error: "Database error." });
			if (!row) return res.status(401).json({ error: "User not found." });

			const finalContactValue = String(row.email || "");
			const finalContactDisplay = computeContactDisplay("email", finalContactValue);
			db.run(
				`INSERT INTO listings (title, description, price, contact, user_id, image_url, contact_method, contact_value, status)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					normalizedTitle,
					normalizedDescription,
					normalizedPrice,
					finalContactDisplay,
					req.userId,
					storedImagePath,
					"email",
					finalContactValue,
					"active",
				],
				function (err2) {
					if (err2) return res.status(500).json({ error: "Database error." });
					return res.status(201).json({ message: "Listing created.", id: this.lastID });
				}
			);
		});
		return;
	}

	const finalContactDisplay = computeContactDisplay(normalizedMethod, normalizedContactValue);
	db.run(
		`INSERT INTO listings (title, description, price, contact, user_id, image_url, contact_method, contact_value, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			normalizedTitle,
			normalizedDescription,
			normalizedPrice,
			finalContactDisplay,
			req.userId,
			storedImagePath,
			normalizedMethod,
			normalizedContactValue,
			"active",
		],
		function (err) {
			if (err) return res.status(500).json({ error: "Database error." });
			return res.status(201).json({ message: "Listing created.", id: this.lastID });
		}
	);
});

// GET /api/mylistings - Return listings created by logged-in user (verified users only)
router.get("/mylistings", authMiddleware, requireVerifiedUser, (req, res) => {
	db.all(
		`SELECT id,
			title,
			description,
			price,
			image_url as imageUrl,
			COALESCE(status, 'active') as status,
			sold_at as soldAt,
			contact_method as contactMethod,
			contact_value as contactValue,
			contact,
			user_id as userId,
			created_at as createdAt
		FROM listings
		WHERE user_id = ?
		ORDER BY datetime(created_at) DESC`,
		[req.userId],
		(err, rows) => {
			if (err) return res.status(500).json({ error: "Database error." });
			const mapped = (rows || []).map((r) => ({
				...r,
				imageUrl: absoluteUrl(req, r.imageUrl),
				status: normalizeStatus(r.status),
			}));
			return res.json(mapped);
		}
	);
});

// GET /api/listings/:id/contact - Return only contact field (verified users only)
router.get("/listings/:id/contact", authMiddleware, requireVerifiedUser, (req, res) => {
	const listingId = Number(req.params.id);
	if (!Number.isInteger(listingId)) return res.status(400).json({ error: "Invalid listing id." });

	function computeContactDisplay(method, value, legacyContact) {
		if (legacyContact && typeof legacyContact === "string" && legacyContact.trim()) return legacyContact;
		if (method === "email") return value || "";
		if (method === "phone") return value || "";
		if (method === "instagram") {
			if (!value) return "";
			return value.startsWith("@") ? value : `@${value}`;
		}
		return value || "";
	}

	db.get(
		`SELECT COALESCE(status, 'active') as status, contact_method, contact_value, contact FROM listings WHERE id = ?`,
		[listingId],
		(err, row) => {
		if (err) return res.status(500).json({ error: "Database error." });
		if (!row) return res.status(404).json({ error: "Listing not found." });
		const status = normalizeStatus(row.status);
		if (status === "sold") return res.status(403).json({ error: "Listing is sold." });
		const method = typeof row.contact_method === "string" ? row.contact_method : null;
		const value = typeof row.contact_value === "string" ? row.contact_value : null;
		return res.json({
			contact: computeContactDisplay(method, value, row.contact),
			contactMethod: method,
			contactValue: value,
		});
		}
	);
});

// PATCH /api/listings/:id/sold - Only owner can mark sold
router.patch("/listings/:id/sold", authMiddleware, (req, res) => {
	const listingId = Number(req.params.id);
	if (!Number.isInteger(listingId)) return res.status(400).json({ error: "Invalid listing id." });

	db.get(`SELECT id, user_id FROM listings WHERE id = ?`, [listingId], (err, row) => {
		if (err) return res.status(500).json({ error: "Database error." });
		if (!row) return res.status(404).json({ error: "Listing not found." });
		if (row.user_id !== req.userId) return res.status(403).json({ error: "Forbidden." });

		db.run(
			`UPDATE listings SET status = 'sold', sold_at = CURRENT_TIMESTAMP WHERE id = ?`,
			[listingId],
			(err2) => {
				if (err2) return res.status(500).json({ error: "Database error." });
				return res.json({ message: "Marked as sold." });
			}
		);
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

		deleteListingAndImageById(listingId, (err2) => {
			if (err2) return res.status(500).json({ error: "Database error." });
			return res.json({ message: "Listing deleted." });
		});
	});
});

module.exports = router;
