import { useState, useEffect } from "react";
import { toast, useDeleteConfirm } from "../components/UI";
import { api } from "../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0 }).format(Math.abs(Number(n)));

function Badge({ type }) {
  const isCredit = type === "credit";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase",
      background: isCredit ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
      color: isCredit ? "#ef4444" : "#22c55e",
      border: `1px solid ${isCredit ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
    }}>
      {isCredit ? "Credit" : "Paid"}
    </span>
  );
}

export default function CreditPersonsPage({ onSelectPerson }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { confirm, modal: deleteModal } = useDeleteConfirm();

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getCreditPersons();
      setPersons(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.addCreditPerson(form);
      setForm({ name: "", phone: "", notes: "" });
      setShowAdd(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const ok = await confirm("this person");
    if (!ok) return;
    try {
      await api.deleteCreditPerson(id);
      load();
      toast.success("Person removed from Khata");
    } catch (e) {
      toast.error(e.message || "Failed to remove person");
    }
  };

  const filtered = persons.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  const totalOutstanding = persons.reduce((s, p) => s + Number(p.balance), 0);

  const inp = { background: "#131520", border: "1px solid #2a2f45", borderRadius: 8, color: "#e8e8e8", padding: "10px 14px", fontSize: 14, fontFamily: "Outfit, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div>
      {deleteModal}
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e8e8e8" }}>
            💳 Khata / Credit Book
          </h1>
          <p style={{ margin: "4px 0 0", color: "#8892b0", fontSize: 14 }}>
            Manage credit accounts and track outstanding balances
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: "linear-gradient(135deg, #f5a623, #e8940f)",
          border: "none", borderRadius: 10, color: "#000", cursor: "pointer",
          fontSize: 14, fontWeight: 700, padding: "10px 20px", fontFamily: "Outfit, sans-serif",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          + Add Person
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", color: "#ef4444", marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Summary card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Persons", value: persons.length, color: "#63b3ed" },
          { label: "Outstanding Balance", value: `Rs. ${fmt(totalOutstanding)}`, color: totalOutstanding > 0 ? "#ef4444" : "#22c55e" },
          { label: "Persons with Credit", value: persons.filter(p => Number(p.balance) > 0).length, color: "#f5a623" },
        ].map(c => (
          <div key={c.label} style={{ background: "#131520", border: "1px solid #1e2235", borderRadius: 12, padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍  Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, maxWidth: 340 }}
        />
      </div>

      {/* Persons table */}
      <div style={{ background: "#131520", border: "1px solid #1e2235", borderRadius: 14, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 1.2fr 80px",
          padding: "12px 20px", borderBottom: "1px solid #1e2235",
          fontSize: 11, color: "#4a5568", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
        }}>
          <span>Person</span>
          <span>Last Activity</span>
          <span>Last Amount</span>
          <span>Last Type</span>
          <span>Balance</span>
          <span></span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>
            {search ? "No persons match your search." : "No persons yet. Add someone to get started."}
          </div>
        ) : (
          filtered.map((p, i) => {
            const balance = Number(p.balance);
            const isPositive = balance > 0;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPerson(p)}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 1.2fr 80px",
                  padding: "16px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #1a1e2e" : "none",
                  cursor: "pointer", transition: "background 0.15s",
                  alignItems: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Name + phone */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{p.name}</div>
                  {p.phone && <div style={{ fontSize: 12, color: "#8892b0", marginTop: 2 }}>{p.phone}</div>}
                </div>

                {/* Last txn date */}
                <div style={{ fontSize: 13, color: "#8892b0" }}>
                  {p.last_txn_date
                    ? new Date(p.last_txn_date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "2-digit" })
                    : "—"}
                </div>

                {/* Last amount */}
                <div style={{ fontSize: 14, fontWeight: 600, color: p.last_type === "credit" ? "#ef4444" : "#22c55e" }}>
                  {p.last_amount ? `Rs. ${fmt(p.last_amount)}` : "—"}
                </div>

                {/* Last type */}
                <div>
                  {p.last_type ? <Badge type={p.last_type} /> : <span style={{ color: "#4a5568", fontSize: 13 }}>—</span>}
                </div>

                {/* Balance */}
                <div style={{ fontSize: 15, fontWeight: 800, color: isPositive ? "#ef4444" : balance < 0 ? "#22c55e" : "#8892b0" }}>
                  {balance === 0 ? "Clear" : `${isPositive ? "" : "-"}Rs. ${fmt(balance)}`}
                </div>

                {/* Delete */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 12, padding: "4px 10px", fontFamily: "Outfit, sans-serif" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Person Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: "#131520", border: "1px solid #2a2f45", borderRadius: 16, padding: 28, width: 400, maxWidth: "90vw",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#e8e8e8" }}>➕ Add New Person</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Name *</label>
                <input
                  placeholder="Person's name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inp}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Phone</label>
                <input
                  placeholder="03XX-XXXXXXX"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8892b0", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Notes</label>
                <input
                  placeholder="Optional note"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={inp}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: "#1e2235", border: "1px solid #2a2f45", borderRadius: 8, color: "#8892b0", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: "11px", fontFamily: "Outfit, sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !form.name.trim()} style={{ flex: 2, background: saving ? "#555" : "linear-gradient(135deg,#f5a623,#e8940f)", border: "none", borderRadius: 8, color: "#000", cursor: saving ? "default" : "pointer", fontSize: 14, fontWeight: 700, padding: "11px", fontFamily: "Outfit, sans-serif" }}>
                {saving ? "Saving…" : "Add Person"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
