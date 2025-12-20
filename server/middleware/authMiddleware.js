const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;
	const hasBearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ");
	if (!hasBearer) {
		return res.status(401).json({ error: "Missing or invalid Authorization header." });
	}

	const token = authHeader.slice("Bearer ".length).trim();
	if (!token) {
		return res.status(401).json({ error: "Missing token." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded || typeof decoded.userId !== "number") {
			return res.status(401).json({ error: "Invalid token." });
		}

		req.userId = decoded.userId;
		return next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token." });
	}
}

module.exports = authMiddleware;
