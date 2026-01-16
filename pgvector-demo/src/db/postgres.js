import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function connectPostgres() {
  try {
    await pool.query("SELECT 1");
    console.log("🐘 PostgreSQL connected...");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed", err);
    process.exit(1);
  }
}
