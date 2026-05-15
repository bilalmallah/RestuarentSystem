import { useState, useEffect } from "react";
import { api } from "../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0 }).format(Math.abs(Number(n)));

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function CreditLedgerPage({ person, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: "", type: "credit", description: "", txn_date: today() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(thisMonth());

  const load = async () => {
    setLoading(true);
    try {
      const [txns, sum] = await Promise.all([
        api.getCreditTransactions(person.id),
        api.getCreditSummary(person.id, month),
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const handleAdd = async () => {
    if (!form.amount || isNaN(Number(form.amount))) return;
    setSaving(true);
    try {
      await api.addCreditTransaction({ ...form, person_id: person.id, amount: Number(form.amount) });
      setForm({ amount: "", type: "credit", description: "", txn_date: today() });
      setShowAdd(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.deleteCreditTransaction(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const inp = { background: "#0f1117", border: "1px solid #2a2f45", borderRadius: 8, color: "#e8e8e8", padding: "10px 14px", fontSize: 14, fontFamily: "Outfit, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };

  const balance = summary ? Number(summary.balance) : 0;

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "#1e2235", border: "1px solid #2a2f45", borderRadius: 8, color: "#8892b0", cursor: "pointer", fontSize: 13, padding: "7px 14px", fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#e8e8e8" }}>
            {person.name}
          </h1>
          {person.phone && <div style={{ fontSize: 13, color: "#8892b0" }}>{person.phone}</div>}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", color: "#ef4444", marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#131520", border: `1px solid ${balance > 0 ? "rgba(239,68,68,0.3)" : balance < 0 ? "rgba(34,197,94,0.3)" : "#1e2235"}`, borderRadius: 12, padding: "18px 20px", gridColumn: "span 2" }}>
          <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Total Remaining Balance</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: balance > 0 ? "#ef4444" : balance < 0 ? "#22c55e" : "#8892b0" }}>
            {balance === 0
              ? "✓ Clear"
              : `${balance > 0 ? "" : "-"}Rs. ${fmt(balance)}`}
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginTop: 6 }}>
            {balance > 0 ? "They owe you this amount" : balance < 0 ? "You owe them this amount" : "All settled up"}
          </div>
        </div>

        <div style={{ background: "#131520", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>This Month Credit</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>
            +Rs. {fmt(summary?.month_credit || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 4 }}>{month}</div>
        </div>

        <div style={{ background: "#131520", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>This Month Paid</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>
            -Rs. {fmt(summary?.month_debit || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 4 }}>{month}</div>
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 12, color: "#8892b0", whiteSpace: "nowrap" }}>Filter Month:</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ ...inp, width: "auto", padding: "7px 12px" }}
          />
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: "linear-gradient(135deg,#f5a623,#e8940f)", border: "none", borderRadius: 10,
          color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: "10px 20px", fontFamily: "Outfit, sans-serif",
        }}>
          + Add Transaction
        </button>
      </div>

      {/* Transactions */}
      <div style={{ background: "#131520", border: "1px solid #1e2235", borderRadius: 14, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "120px 1fr 120px 140px 40px",
          padding: "12px 20px", borderBottom: "1px solid #1e2235",
          fontSize: 11, color: "#4a5568", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
        }}>
          <span>Date</span>
          <span>Description</span>
          <span>Amount</span>
          <span>Running Balance</span>
          <span></span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>
            No transactions yet. Add the first one.
          </div>
        ) : (
          transactions.map((t, i) => {
            const isCredit = t.type === "credit";
            const rb = Number(t.running_balance);
            return (
              <div
                key={t.id}
                style={{
                  display: "grid", gridTemplateColumns: "120px 1fr 120px 140px 40px",
                  padding: "14px 20px",
                  borderBottom: i < transactions.length - 1 ? "1px solid #1a1e2e" : "none",
                  borderLeft: `3px solid ${isCredit ? "#ef4444" : "#22c55e"}`,
                  alignItems: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Date */}
                <div style={{ fontSize: 13, color: "#8892b0" }}>
                  {new Date(t.txn_date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "2-digit" })}
                </div>

                {/* Description */}
                <div style={{ fontSize: 14, color: t.description ? "#e8e8e8" : "#4a5568", fontStyle: t.description ? "normal" : "italic" }}>
                  {t.description || "No description"}
                </div>

                {/* Amount */}
                <div style={{ fontSize: 16, fontWeight: 800, color: isCredit ? "#ef4444" : "#22c55e" }}>
                  {isCredit ? "+" : "-"}Rs. {fmt(t.amount)}
                </div>

                {/* Running balance */}
                <div style={{ fontSize: 14, fontWeight: 700, color: rb > 0 ? "#ef4444" : rb < 0 ? "#22c55e" : "#8892b0" }}>
                  {rb === 0 ? "Clear" : `${rb > 0 ? "" : "-"}Rs. ${fmt(rb)}`}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{ background: "transparent", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: "#131520", border: "1px solid #2a2f45", borderRadius: 16, padding: 28, width: 420, maxWidth: "92vw",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#e8e8e8" }}>
              ➕ New Transaction
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8892b0" }}>for {person.name}</p>

            {/* Type toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {[
                { val: "credit", label: "Credit (+)", sub: "They owe you", color: "#ef4444" },
                { val: "debit", label: "Payment (-)", sub: "They paid", color: "#22c55e" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setForm({ ...form, type: opt.val })}
                  style={{
                    border: `2px solid ${form.type === opt.val ? opt.color : "#2a2f45"}`,
                    borderRadius: 10, background: form.type === opt.val ? `rgba(${opt.val === "credit" ? "239,68,68" : "34,197,94"},0.1)` : "#0f1117",
                    color: form.type === opt.val ? opt.color : "#8892b0",
                    cursor: "pointer", padding: "12px", textAlign: "center", fontFamily: "Outfit, sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Amount (Rs.) *</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inp, fontSize: 20, fontWeight: 800, color: form.type === "credit" ? "#ef4444" : "#22c55e" }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Date</label>
                <input
                  type="date"
                  value={form.txn_date}
                  onChange={e => setForm({ ...form, txn_date: e.target.value })}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Description</label>
                <input
                  placeholder="e.g. Dinner bill, Monthly payment…"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={inp}
                />
              </div>
            </div>

            {/* Preview */}
            {form.amount && !isNaN(Number(form.amount)) && (
              <div style={{ marginTop: 16, padding: "10px 14px", background: form.type === "credit" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", borderRadius: 8, border: `1px solid ${form.type === "credit" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                <span style={{ fontSize: 13, color: "#8892b0" }}>This will record: </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: form.type === "credit" ? "#ef4444" : "#22c55e" }}>
                  {form.type === "credit" ? "+" : "-"}Rs. {fmt(form.amount)}
                </span>
                <span style={{ fontSize: 13, color: "#8892b0" }}>
                  {form.type === "credit" ? " — added to their credit" : " — deducted from balance"}
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: "#1e2235", border: "1px solid #2a2f45", borderRadius: 8, color: "#8892b0", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: "11px", fontFamily: "Outfit, sans-serif" }}>
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.amount || isNaN(Number(form.amount))}
                style={{
                  flex: 2, border: "none", borderRadius: 8, cursor: saving ? "default" : "pointer",
                  fontSize: 14, fontWeight: 700, padding: "11px", fontFamily: "Outfit, sans-serif",
                  background: saving ? "#555" : form.type === "credit"
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "#fff",
                }}
              >
                {saving ? "Saving…" : form.type === "credit" ? "Add Credit" : "Add Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
