import express from "express";
import pool from "../db.js";

const router = express.Router();

// Login route
router.post("/", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await pool.query(
      "SELECT id, username, name, email FROM customers WHERE username = $1 AND password = $2",
      [username, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    res.json({ 
      message: "Login successful",
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;