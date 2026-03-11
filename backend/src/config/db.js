import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize table on startup
export async function initDB() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS documents (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_url    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'uploaded',
      raw_text    TEXT,
      extracted_data JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("[db] PostgreSQL connected and table ready");
}

export default pool;
