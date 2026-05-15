// routes/credit.js  –  Credit / Debit (Khata) routes
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

router.use(auth);

/* ─────────────────────────────────────────
   PERSONS
───────────────────────────────────────── */

// GET /api/credit/persons  – list with balance summary
router.get("/persons", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        p.id,
        p.name,
        p.phone,
        p.notes,
        p.is_active,
        p.created_at,

        -- total balance: sum of signed amounts
        COALESCE(SUM(
          CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
        ), 0) AS balance,

        -- last transaction info
        MAX(t.txn_date) AS last_txn_date,
        (SELECT t2.amount
           FROM credit_transactions t2
          WHERE t2.person_id = p.id
          ORDER BY t2.created_at DESC LIMIT 1) AS last_amount,
        (SELECT t2.type
           FROM credit_transactions t2
          WHERE t2.person_id = p.id
          ORDER BY t2.created_at DESC LIMIT 1) AS last_type

      FROM credit_persons p
      LEFT JOIN credit_transactions t ON t.person_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id
      ORDER BY p.name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/credit/persons
router.post("/persons", async (req, res) => {
  const { name, phone = "", notes = "" } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const { rows } = await db.query(
      `INSERT INTO credit_persons (name, phone, notes) VALUES ($1,$2,$3) RETURNING *`,
      [name.trim(), phone.trim(), notes.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/credit/persons/:id
router.put("/persons/:id", async (req, res) => {
  const { name, phone, notes, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE credit_persons
          SET name=$1, phone=$2, notes=$3, is_active=$4
        WHERE id=$5 RETURNING *`,
      [name, phone ?? "", notes ?? "", is_active ?? true, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/credit/persons/:id  (soft delete)
router.delete("/persons/:id", async (req, res) => {
  try {
    await db.query(
      `UPDATE credit_persons SET is_active=FALSE WHERE id=$1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────
   TRANSACTIONS
───────────────────────────────────────── */

// GET /api/credit/transactions/:personId
router.get("/transactions/:personId", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM credit_transactions
       WHERE person_id = $1
       ORDER BY txn_date DESC, created_at DESC
    `, [req.params.personId]);

    // running balance (most-recent first for display, oldest-first for running total)
    const ordered = [...rows].reverse();
    let running = 0;
    const withBalance = ordered.map(r => {
      running += r.type === "credit" ? Number(r.amount) : -Number(r.amount);
      return { ...r, running_balance: running };
    });

    res.json(withBalance.reverse()); // back to newest-first
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/credit/transactions
router.post("/transactions", async (req, res) => {
  const { person_id, amount, type, description = "", txn_date } = req.body;
  if (!person_id || !amount || !type)
    return res.status(400).json({ error: "person_id, amount and type are required" });
  try {
    const { rows } = await db.query(
      `INSERT INTO credit_transactions (person_id, amount, type, description, txn_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [person_id, Math.abs(Number(amount)), type, description.trim(), txn_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/credit/transactions/:id
router.delete("/transactions/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM credit_transactions WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────
   SUMMARY for a person
───────────────────────────────────────── */

// GET /api/credit/summary/:personId?month=2025-05
router.get("/summary/:personId", async (req, res) => {
  const { month } = req.query; // e.g. "2025-05"
  try {
    // all-time balance
    const bal = await db.query(`
      SELECT COALESCE(SUM(
        CASE WHEN type='credit' THEN amount ELSE -amount END
      ),0) AS balance
      FROM credit_transactions WHERE person_id=$1
    `, [req.params.personId]);

    // this month
    const now = month || new Date().toISOString().slice(0,7);
    const mon = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END),0) AS month_credit,
        COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END),0) AS month_debit
      FROM credit_transactions
      WHERE person_id=$1
        AND to_char(txn_date,'YYYY-MM') = $2
    `, [req.params.personId, now]);

    res.json({
      balance:      Number(bal.rows[0].balance),
      month_credit: Number(mon.rows[0].month_credit),
      month_debit:  Number(mon.rows[0].month_debit),
      month:        now,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
