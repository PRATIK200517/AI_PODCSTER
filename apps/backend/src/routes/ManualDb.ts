import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const router3 = express.Router();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Run a query
async function AddChange(query: string, values?: any[]) {
  try {
    const result = await pool.query(query, values);
    return result;
  } catch (error) {
    console.error("DB error:", error);
    throw error;
  }
}

router3.post("/db/updateDB", async (req: Request, res: Response) => {
  try {
    // Example: get query & params from body
    const { query, values } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const result = await AddChange(query, values);

    res.json({ success: true, rows: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database update failed" });
  }
});

export default router3;
