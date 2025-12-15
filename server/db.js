const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!pool) {
    // Opción 1: URL completa (recomendado)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Supabase suele requerir SSL
      });
      return pool;
    }

    // Opción 2: variables sueltas
    pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

module.exports = { getPool };
