import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all employees
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(
      "SELECT employee_id, name, role FROM employees ORDER BY employee_id;"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add employee
router.post("/", async (req, res) => {
  const { name, role, username, password } = req.body;
  try {
    await pool.query(
      "INSERT INTO employees (name, role, username, password) VALUES ($1,$2,$3,$4)",
      [name, role, username, password]
    );
    res.status(201).json({ message: "Employee added" });
  } catch (err) {
    res.status(500).json({ error: "Insert failed" });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM employees WHERE employee_id=$1", [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;