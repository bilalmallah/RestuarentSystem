/**
 * Migration Runner
 * Run: node migrate.js
 * 
 * - Creates the database if it doesn't exist
 * - Creates a migrations tracking table
 * - Runs each .sql file in /migrations folder in order
 * - Skips already-run migrations
 * - Seeds default users on first run
 */

require("dotenv").config();
const { Client, Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_NAME = process.env.DB_NAME || "RestaurantOS";
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function createDatabaseIfNeeded() {
  // Connect to default 'postgres' DB to create our DB
  const client = new Client({
    host:     process.env.DB_HOST     || "localhost",
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: "postgres",
    user:     process.env.DB_USER     || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database '${DB_NAME}' created`);
    } else {
      console.log(`ℹ️  Database '${DB_NAME}' already exists`);
    }
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  const pool = new Pool({
    host:     process.env.DB_HOST     || "localhost",
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: DB_NAME,
    user:     process.env.DB_USER     || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  });

  try {
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT UNIQUE NOT NULL,
        ran_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already-run migrations
    const { rows: done } = await pool.query("SELECT filename FROM _migrations ORDER BY filename");
    const doneSet = new Set(done.map(r => r.filename));

    // Read migration files sorted
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (doneSet.has(file)) {
        console.log(`  ⏭  Skipping ${file} (already run)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
      console.log(`  ✅ Ran migration: ${file}`);
      ran++;
    }

    if (ran === 0) console.log("  ℹ️  No new migrations to run");

    // Seed default users if none exist
    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(rows[0].count) === 0) {
      const hash = bcrypt.hashSync("1234", 10);
      await pool.query(
        "INSERT INTO users (name, username, password, role) VALUES ($1,$2,$3,$4),($5,$6,$7,$8)",
        ["Owner", "owner", hash, "owner", "Manager", "manager", hash, "manager"]
      );
      console.log("✅ Default users seeded:");
      console.log("   👤 owner / 1234");
      console.log("   👤 manager / 1234");

      // Seed sample kitchen items
      const items = [
        ["Chicken",        "Meat",       "kg",    5],
        ["Beef",           "Meat",       "kg",    3],
        ["Mutton",         "Meat",       "kg",    2],
        ["Hari Mirch",     "Spices",     "kg",    1],
        ["Laal Mirch",     "Spices",     "kg",    0.5],
        ["Haldi",          "Spices",     "kg",    0.5],
        ["Zeera",          "Spices",     "kg",    0.5],
        ["Dhania Powder",  "Spices",     "kg",    0.5],
        ["Garam Masala",   "Spices",     "pkt",   2],
        ["Tomatoes",       "Vegetables", "kg",    5],
        ["Onions",         "Vegetables", "kg",    5],
        ["Garlic",         "Vegetables", "kg",    2],
        ["Ginger",         "Vegetables", "kg",    1],
        ["Potatoes",       "Vegetables", "kg",    5],
        ["Cooking Oil",    "Dry Goods",  "litre", 5],
        ["Desi Ghee",      "Dry Goods",  "kg",    2],
        ["Basmati Rice",   "Dry Goods",  "kg",    10],
        ["Maida",          "Dry Goods",  "kg",    5],
        ["Aata",           "Dry Goods",  "kg",    10],
        ["Dal Chana",      "Pulses",     "kg",    3],
        ["Dal Masoor",     "Pulses",     "kg",    2],
        ["Salt",           "Dry Goods",  "kg",    2],
        ["Milk",           "Dairy",      "litre", 5],
        ["Cream",          "Dairy",      "litre", 1],
        ["Paneer",         "Dairy",      "kg",    1],
        ["Gas Cylinder",   "Utilities",  "pcs",   1],
        ["Tissue Paper",   "Supplies",   "pkt",   5],
        ["Disposable Cups","Supplies",   "pkt",   3],
      ];
      for (let i = 0; i < items.length; i++) {
        const [name, category, unit, min_qty] = items[i];
        await pool.query(
          "INSERT INTO kitchen_items (name, category, unit, min_quantity, sort_order) VALUES ($1,$2,$3,$4,$5)",
          [name, category, unit, min_qty, i]
        );
      }
      console.log(`✅ ${items.length} sample kitchen items seeded`);
    }

    console.log("\n🚀 Migration complete! You can now run: node server.js\n");
  } finally {
    await pool.end();
  }
}

(async () => {
  console.log("\n================================================");
  console.log("  RestaurantOS — Database Migration Runner");
  console.log("================================================\n");
  try {
    await createDatabaseIfNeeded();
    await runMigrations();
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    console.error("   Check your .env file and ensure PostgreSQL is running.");
    process.exit(1);
  }
})();
