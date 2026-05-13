const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Ensure pdfs directory exists
const PDF_DIR = path.join(__dirname, "../pdfs");
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

// ── KITCHEN ITEMS (master list) ───────────────────────────────

router.get("/items", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM kitchen_items WHERE is_active=TRUE ORDER BY category, sort_order, name"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/items", auth, async (req, res) => {
  try {
    const { name, category, unit, min_quantity } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const { rows } = await db.query(
      "INSERT INTO kitchen_items (name, category, unit, min_quantity) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, category || "General", unit || "kg", min_quantity || 0]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/items/:id", auth, async (req, res) => {
  try {
    const { name, category, unit, min_quantity, is_active } = req.body;
    await db.query(
      "UPDATE kitchen_items SET name=$1, category=$2, unit=$3, min_quantity=$4, is_active=$5 WHERE id=$6",
      [name, category, unit, min_quantity, is_active !== false, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/items/:id", auth, async (req, res) => {
  try {
    await db.query("UPDATE kitchen_items SET is_active=FALSE WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CLOSING CHECKLISTS ────────────────────────────────────────

router.get("/checklists", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM closing_checklists ORDER BY created_at DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/checklists/:id", auth, async (req, res) => {
  try {
    const [cl, entries] = await Promise.all([
      db.query("SELECT * FROM closing_checklists WHERE id=$1", [req.params.id]),
      db.query("SELECT * FROM checklist_entries WHERE checklist_id=$1 ORDER BY created_at", [req.params.id]),
    ]);
    if (!cl.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ ...cl.rows[0], entries: entries.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start a new closing checklist (pre-populate with all active kitchen items)
router.post("/checklists/start", auth, async (req, res) => {
  try {
    const { date, notes } = req.body;
    const checkDate = date || new Date().toISOString().slice(0, 10);

    // Create the checklist
    const { rows: [cl] } = await db.query(
      "INSERT INTO closing_checklists (date, checked_by, notes) VALUES ($1,$2,$3) RETURNING *",
      [checkDate, req.user.name, notes || ""]
    );

    // Pre-populate with all active kitchen items
    const { rows: items } = await db.query(
      "SELECT * FROM kitchen_items WHERE is_active=TRUE ORDER BY category, sort_order, name"
    );

    for (const item of items) {
      await db.query(
        "INSERT INTO checklist_entries (checklist_id, kitchen_item_id, item_name, unit, is_available) VALUES ($1,$2,$3,$4,$5)",
        [cl.id, item.id, item.name, item.unit, true]
      );
    }

    const { rows: entries } = await db.query(
      "SELECT * FROM checklist_entries WHERE checklist_id=$1 ORDER BY created_at", [cl.id]
    );

    res.json({ ...cl, entries });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update a single checklist entry (available/not, quantity, needs reorder)
router.put("/checklists/:id/entries/:entryId", auth, async (req, res) => {
  try {
    const { is_available, quantity_found, needs_reorder, reorder_qty, note } = req.body;
    const { rows } = await db.query(`
      UPDATE checklist_entries
      SET is_available=$1, quantity_found=$2, needs_reorder=$3, reorder_qty=$4, note=$5
      WHERE id=$6 AND checklist_id=$7
      RETURNING *`,
      [is_available, quantity_found || null, needs_reorder || false, reorder_qty || null, note || "", req.params.entryId, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Complete checklist and generate PDF
router.post("/checklists/:id/complete", auth, async (req, res) => {
  try {
    const checklistId = req.params.id;

    // Get checklist + entries
    const { rows: [cl] } = await db.query("SELECT * FROM closing_checklists WHERE id=$1", [checklistId]);
    const { rows: entries } = await db.query(
      "SELECT * FROM checklist_entries WHERE checklist_id=$1 ORDER BY created_at", [checklistId]
    );

    if (!cl) return res.status(404).json({ error: "Checklist not found" });

    // Generate PDF
    const pdfFileName = `closing_checklist_${checklistId}_${Date.now()}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFileName);
    await generateChecklistPDF(cl, entries, pdfPath);

    // Mark completed
    await db.query(
      "UPDATE closing_checklists SET status='completed', completed_at=NOW(), pdf_path=$1 WHERE id=$2",
      [pdfFileName, checklistId]
    );

    // Create reorder list from items that need it
    const reorderItems = entries.filter(e => !e.is_available || e.needs_reorder).map(e => ({
      name: e.item_name,
      unit: e.unit,
      qty: e.reorder_qty || null,
      reason: !e.is_available ? "Not Available" : "Low Stock",
      note: e.note || "",
    }));

    if (reorderItems.length > 0) {
      const rlPdfName = `reorder_list_${checklistId}_${Date.now()}.pdf`;
      const rlPdfPath = path.join(PDF_DIR, rlPdfName);
      await generateReorderPDF(cl, reorderItems, rlPdfPath);

      await db.query(
        "INSERT INTO reorder_lists (checklist_id, date, created_by, items, pdf_path) VALUES ($1,$2,$3,$4,$5)",
        [checklistId, cl.date, req.user.name, JSON.stringify(reorderItems), rlPdfName]
      );
    }

    res.json({ success: true, pdfPath: pdfFileName, reorderCount: reorderItems.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Download PDF
router.get("/pdf/:filename", auth, (req, res) => {
  const filePath = path.join(PDF_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "PDF not found" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${req.params.filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Reorder lists
router.get("/reorder-lists", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM reorder_lists ORDER BY created_at DESC LIMIT 30"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PDF GENERATORS ────────────────────────────────────────────

function generateChecklistPDF(checklist, entries, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill("#1a1a2e");
    doc.fillColor("#f5a623").fontSize(24).font("Helvetica-Bold")
       .text("Sindhu Fish Point", 50, 25);
    doc.fillColor("white").fontSize(13).font("Helvetica")
       .text("Kitchen Closing Checklist", 50, 55);
    doc.moveDown(2);

    // Info bar
    doc.fillColor("#333").fontSize(11).font("Helvetica-Bold");
    doc.text(`Date: ${checklist.date}   |   Checked By: ${checklist.checked_by}   |   Checklist #${checklist.id}`, 50, 105);
    if (checklist.notes) doc.text(`Notes: ${checklist.notes}`, 50, 122);

    doc.moveTo(50, 140).lineTo(545, 140).strokeColor("#e0e0e0").stroke();

    // Summary
    const total     = entries.length;
    const available = entries.filter(e => e.is_available).length;
    const missing   = entries.filter(e => !e.is_available).length;
    const reorder   = entries.filter(e => e.needs_reorder).length;

    doc.rect(50, 148, 495, 45).fill("#f8f9fa");
    doc.fillColor("#333").fontSize(10).font("Helvetica-Bold")
       .text(`Total Items: ${total}`, 70, 158)
       .text(`✅ Available: ${available}`, 185, 158)
       .text(`❌ Not Available: ${missing}`, 300, 158)
       .text(`⚠️  Needs Reorder: ${reorder}`, 415, 158);

    let y = 210;

    // Group entries by category
    const groups = {};
    entries.forEach(e => {
      const cat = e.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });

    // Draw each category
    for (const [category, items] of Object.entries(groups)) {
      if (y > 720) { doc.addPage(); y = 50; }

      // Category header
      doc.rect(50, y, 495, 22).fill("#2c3e50");
      doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
         .text(category.toUpperCase(), 60, y + 6);
      y += 30;

      // Column headers
      doc.fillColor("#666").fontSize(9).font("Helvetica-Bold")
         .text("ITEM", 60, y)
         .text("UNIT", 235, y)
         .text("STATUS", 295, y)
         .text("QTY FOUND", 375, y)
         .text("NOTE", 455, y);
      doc.moveTo(50, y + 14).lineTo(545, y + 14).strokeColor("#ddd").lineWidth(0.5).stroke();
      y += 20;

      for (const entry of items) {
        if (y > 700) { doc.addPage(); y = 50; }
        

        const rowBg = entry.is_available ? "#ffffff" : "#fff3f3";
        doc.rect(50, y - 2, 495, 20).fill(rowBg);

        // Status dot
        const dotColor = !entry.is_available ? "#e74c3c" : entry.needs_reorder ? "#f39c12" : "#27ae60";
        doc.circle(56, y + 7, 4).fill(dotColor);

        doc.fillColor("#222").fontSize(9).font("Helvetica")
           .text(entry.item_name || "", 65, y + 2, { width: 160 })
           .text(entry.unit || "", 235, y + 2)
           .text(entry.is_available ? (entry.needs_reorder ? "⚠️ Low Stock" : "✅ Available") : "❌ Not Available", 295, y + 2)
           .text(entry.quantity_found != null ? String(entry.quantity_found) : "—", 375, y + 2)
           .text(entry.note || "", 455, y + 2, { width: 90 });

        doc.moveTo(50, y + 18).lineTo(545, y + 18).strokeColor("#f0f0f0").lineWidth(0.3).stroke();
        y += 22;
      }
      y += 8;
    }

    // Footer
    doc.moveTo(50, doc.page.height - 60).lineTo(545, doc.page.height - 60).strokeColor("#ddd").stroke();
    doc.fillColor("#999").fontSize(8).font("Helvetica")
       .text(`Generated by Sindhu Fish Point • ${new Date().toLocaleString()}`, 50, doc.page.height - 48, { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

function generateReorderPDF(checklist, items, outputPath) {
  return new Promise((resolve, reject) => {

    // 80mm thermal width
    const doc = new PDFDocument({
      size: [226, 800], // 80mm receipt
      margin: 10
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // HEADER
    doc.font("Helvetica-Bold")
       .fontSize(16)
       .text("Sindhu Fish Point", {
         align: "center"
       });

    doc.moveDown(0.3);

    doc.fontSize(10)
       .font("Helvetica")
       .text("Shopping / Reorder List", {
         align: "center"
       });

    doc.moveDown(0.5);

    doc.fontSize(8)
       .text(`Checklist #${checklist.id}`, {
         align: "center"
       });

    doc.text(`${new Date().toLocaleString()}`, {
      align: "center"
    });

    doc.moveDown();

    doc.text("--------------------------------");

    // ITEMS
    items.forEach((item, idx) => {

      doc.font("Helvetica-Bold")
         .fontSize(10)
         .text(`${idx + 1}. ${item.name}`);

      doc.font("Helvetica")
         .fontSize(8)
         .text(`Qty: ${item.qty || "-" } ${item.unit || ""}`);

      doc.text(`Reason: ${item.reason}`);

      if (item.note) {
        doc.text(`Note: ${item.note}`);
      }

      doc.moveDown(0.5);

      doc.text("--------------------------------");
    });

    doc.moveDown();

    // FOOTER
    doc.font("Helvetica-Bold")
       .fontSize(10)
       .text("END OF LIST", {
         align: "center"
       });

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

module.exports = router;
