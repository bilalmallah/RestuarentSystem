const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM employees WHERE is_active = TRUE ORDER BY name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name, role, phone, joined_date } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const { rows } = await db.query(
      "INSERT INTO employees (name, role, phone, joined_date) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, role || "Staff", phone || "", joined_date || new Date().toISOString().slice(0,10)]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { name, role, phone } = req.body;
    await db.query("UPDATE employees SET name=$1, role=$2, phone=$3 WHERE id=$4", [name, role, phone, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("UPDATE employees SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
