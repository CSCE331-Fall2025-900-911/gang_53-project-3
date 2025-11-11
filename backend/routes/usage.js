import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/usage?start=2025-09-01&end=2025-11-10
router.get("/", async (req, res) => {
  const { start, end } = req.query;
  try {
    const result = await pool.query(
      `
      SELECT 
        i.name AS product_name,
        DATE(o.order_date) AS order_day,
        SUM(oi.quantity) AS total_quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN inventory i ON oi.inventory_id = i.inventory_id
      WHERE o.order_date BETWEEN $1 AND $2
      GROUP BY i.name, order_day
      ORDER BY order_day ASC;
      `,
      [start, end]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching usage data:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;