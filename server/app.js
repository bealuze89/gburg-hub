const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
require("./db");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const listingsRoutes = require("./routes/listings");

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  // non-fatal
}

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", listingsRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


