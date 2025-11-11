import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        inventory_id, 
        name, 
        price::float AS price, 
        quantity_on_hand, 
        category, 
        seasonal 
      FROM inventory
      WHERE category = 'product';
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;