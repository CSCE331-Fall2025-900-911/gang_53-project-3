import express from "express";
import pool from "../db.js";

const router = express.Router();

// X-Report (hourly sales today)
router.get("/xreport", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM o.order_date) AS hour,
        COALESCE(SUM(oi.quantity * i.price), 0) AS total_sales
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN inventory i ON oi.inventory_id = i.inventory_id
      WHERE DATE(o.order_date) = CURRENT_DATE
      GROUP BY hour
      ORDER BY hour;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch X-Report" });
  }
});

// Z-Report (summary stats)
router.get("/zreport", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(oi.quantity * i.price), 0) AS total_sales,
        AVG(oi.quantity * i.price) AS avg_order_value
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN inventory i ON oi.inventory_id = i.inventory_id
      WHERE DATE(o.order_date) = CURRENT_DATE;
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Z-Report" });
  }
});

export default router;