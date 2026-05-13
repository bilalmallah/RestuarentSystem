const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

// ── SALES ─────────────────────────────────────────────────────
router.get("/sales", auth, async (req, res) => {
  try {
    const { date, month } = req.query;
    let q = "SELECT * FROM daily_sales", params = [];
    if (date)  { q += " WHERE date = $1"; params = [date]; }
    else if (month) { q += " WHERE TO_CHAR(date,'YYYY-MM') = $1"; params = [month]; }
    q += " ORDER BY date DESC";
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/sales", auth, async (req, res) => {
  try {
    const { date, total_sale, note } = req.body;
    const { rows } = await db.query(`
      INSERT INTO daily_sales (date, total_sale, note, created_by)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (date) DO UPDATE SET total_sale=$2, note=$3, created_by=$4
      RETURNING *`, [date, total_sale, note || "", req.user.name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COMMISSIONS ───────────────────────────────────────────────
router.get("/commissions", auth, async (req, res) => {
  try {
    const { date, month, employee_id } = req.query;
    let q = "SELECT * FROM commissions WHERE 1=1", p = [], i = 1;
    if (date)        { q += ` AND date=$${i++}`;                    p.push(date); }
    if (month)       { q += ` AND TO_CHAR(date,'YYYY-MM')=$${i++}`; p.push(month); }
    if (employee_id) { q += ` AND employee_id=$${i++}`;             p.push(employee_id); }
    q += " ORDER BY date DESC, created_at DESC";
    const { rows } = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/commissions", auth, async (req, res) => {
  try {
    const { date, employee_id, employee_name, amount, note } = req.body;
    const { rows } = await db.query(`
      INSERT INTO commissions (date, employee_id, employee_name, amount, note, recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (date, employee_id) DO UPDATE SET amount=$4, note=$5, recorded_by=$6
      RETURNING *`, [date, employee_id, employee_name, amount, note || "", req.user.name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/commissions/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM commissions WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PAYOUTS ───────────────────────────────────────────────────
router.get("/payouts", auth, async (req, res) => {
  try {
    const { date, month } = req.query;
    let q = "SELECT * FROM fixed_payouts WHERE 1=1", p = [], i = 1;
    if (date)  { q += ` AND date=$${i++}`;                    p.push(date); }
    if (month) { q += ` AND TO_CHAR(date,'YYYY-MM')=$${i++}`; p.push(month); }
    q += " ORDER BY date DESC";
    const { rows } = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/payouts", auth, async (req, res) => {
  try {
    const { date, recipient, recipient_type, amount, note } = req.body;
    const { rows } = await db.query(
      "INSERT INTO fixed_payouts (date,recipient,recipient_type,amount,note,recorded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [date, recipient, recipient_type || "other", amount, note || "", req.user.name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/payouts/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM fixed_payouts WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── EXPENSES ──────────────────────────────────────────────────
router.get("/expenses", auth, async (req, res) => {
  try {
    const { month } = req.query;
    let q = "SELECT * FROM expenses", p = [];
    if (month) { q += " WHERE TO_CHAR(date,'YYYY-MM') = $1"; p = [month]; }
    q += " ORDER BY date DESC";
    const { rows } = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/expenses", auth, async (req, res) => {
  try {
    const { date, category, description, amount, paid_by } = req.body;
    const { rows } = await db.query(
      "INSERT INTO expenses (date,category,description,amount,paid_by) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [date, category || "Other", description, amount, paid_by || req.user.name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/expenses/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM expenses WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SUMMARY ───────────────────────────────────────────────────
router.get("/summary/daily", auth, async (req, res) => {
  try {
    const { date } = req.query;
    const [sale, comms, pays, exps] = await Promise.all([
      db.query("SELECT * FROM daily_sales WHERE date=$1", [date]),
      db.query("SELECT * FROM commissions WHERE date=$1 ORDER BY created_at", [date]),
      db.query("SELECT * FROM fixed_payouts WHERE date=$1 ORDER BY created_at", [date]),
      db.query("SELECT * FROM expenses WHERE date=$1 ORDER BY created_at", [date]),
    ]);
    const totalSale        = sale.rows[0]?.total_sale || 0;
    const totalCommissions = comms.rows.reduce((s,r) => s + parseInt(r.amount), 0);
    const totalPayouts     = pays.rows.reduce((s,r)  => s + parseInt(r.amount), 0);
    const totalExpenses    = exps.rows.reduce((s,r)  => s + parseInt(r.amount), 0);
    res.json({ sale: sale.rows[0] || null, commissions: comms.rows, payouts: pays.rows, expenses: exps.rows, totalSale, totalCommissions, totalPayouts, totalExpenses, remaining: totalSale - totalCommissions - totalPayouts - totalExpenses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/summary/monthly", auth, async (req, res) => {
  try {
    const { month } = req.query;
    const [sales, comms, pays, exps] = await Promise.all([
      db.query("SELECT * FROM daily_sales WHERE TO_CHAR(date,'YYYY-MM')=$1 ORDER BY date", [month]),
      db.query("SELECT * FROM commissions WHERE TO_CHAR(date,'YYYY-MM')=$1 ORDER BY date", [month]),
      db.query("SELECT * FROM fixed_payouts WHERE TO_CHAR(date,'YYYY-MM')=$1 ORDER BY date", [month]),
      db.query("SELECT * FROM expenses WHERE TO_CHAR(date,'YYYY-MM')=$1 ORDER BY date", [month]),
    ]);
    const totalSales       = sales.rows.reduce((s,r) => s + parseInt(r.total_sale), 0);
    const totalCommissions = comms.rows.reduce((s,r) => s + parseInt(r.amount), 0);
    const totalPayouts     = pays.rows.reduce((s,r)  => s + parseInt(r.amount), 0);
    const totalExpenses    = exps.rows.reduce((s,r)  => s + parseInt(r.amount), 0);
    const empMap = {};
    comms.rows.forEach(c => {
      if (!empMap[c.employee_id]) empMap[c.employee_id] = { id: c.employee_id, name: c.employee_name, total: 0, days: 0 };
      empMap[c.employee_id].total += parseInt(c.amount);
      empMap[c.employee_id].days  += 1;
    });
    res.json({ sales: sales.rows, commissions: comms.rows, payouts: pays.rows, expenses: exps.rows, totalSales, totalCommissions, totalPayouts, totalExpenses, employeeSummary: Object.values(empMap), remaining: totalSales - totalCommissions - totalPayouts - totalExpenses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
