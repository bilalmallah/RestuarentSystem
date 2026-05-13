const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "RestaurantOS",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    console.error("   Make sure PostgreSQL is running and .env is configured correctly.");
  } else {
    console.log("✅ PostgreSQL connected successfully");
    release();
  }
});

module.exports = pool;
