const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL no está definido en server/.env");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase usa SSL
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
}

module.exports = { getPool };
