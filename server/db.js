const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to database file
const dbPath = path.join(__dirname, "database.sqlite");

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

module.exports = db;

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Email verification table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Listings table
  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      contact TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

