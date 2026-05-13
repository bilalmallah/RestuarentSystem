import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Btn, Card, Modal, Field, PageHeader, Badge, Input, Select, Spinner, Table, TD, Rs } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Food & Ingredients", "Utilities", "Staff", "Maintenance", "Rent", "Transport", "Marketing", "Cleaning", "Equipment", "Other"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "Other", description: "", amount: "", paid_by: user?.name || "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setExpenses(await api.getExpenses({ month })); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await api.addExpense({ ...form, amount: Number(form.amount) });
      await load();
      setModal(false);
      setForm({ date: new Date().toISOString().slice(0, 10), category: "Other", description: "", amount: "", paid_by: user?.name || "" });
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await api.deleteExpense(id);
    load();
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = CATEGORIES.map(c => ({ cat: c, amount: expenses.filter(e => e.category === c).reduce((s, x) => s + Number(x.amount), 0) })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`Total this month: ${Rs(total)}`}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }} />
            <Btn onClick={() => setModal(true)}>＋ Add Expense</Btn>
          </div>
        }
      />

      {/* Category summary */}
      {byCategory.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {byCategory.map(c => (
            <div key={c.cat} style={{ background: "#13151f", border: "1px solid #1e2235", borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.cat}</div>
              <div style={{ fontWeight: 700, color: "#a78bfa", fontSize: 16 }}>{Rs(c.amount)}</div>
            </div>
          ))}
        </div>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>All Expenses — {month}</div>
          <div style={{ fontWeight: 800, color: "#a78bfa" }}>{Rs(total)}</div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>No expenses recorded for {month}</div>
        ) : (
          <Table headers={["Date", "Category", "Description", "Amount", "Paid By", "Actions"]}>
            {expenses.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
              <tr key={e.id}
                onMouseEnter={ev => ev.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
              >
                <TD><span style={{ color: "#8892b0" }}>{e.date}</span></TD>
                <TD><Badge type="purple">{e.category}</Badge></TD>
                <TD><span style={{ fontWeight: 600 }}>{e.description}</span></TD>
                <TD><span style={{ fontWeight: 700, color: "#a78bfa", fontSize: 15 }}>{Rs(e.amount)}</span></TD>
                <TD><span style={{ color: "#8892b0" }}>{e.paid_by || "—"}</span></TD>
                <TD><Btn size="sm" variant="danger" onClick={() => remove(e.id)}>✕</Btn></TD>
              </tr>
            ))}
          </Table>
        )}
        <div style={{ padding: "10px 20px", background: "rgba(167,139,250,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8892b0", fontWeight: 600 }}>Total Expenses</span>
          <span style={{ fontWeight: 800, color: "#a78bfa" }}>{Rs(total)}</span>
        </div>
      </Card>

      {modal && (
        <Modal title="Add Expense" onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="e.g. Gas cylinder refill, Chicken purchase" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Amount (Rs)">
              <Input type="number" value={form.amount} onChange={v => setForm(p => ({ ...p, amount: v }))} placeholder="0" min="0" />
            </Field>
            <Field label="Paid By">
              <Input value={form.paid_by} onChange={v => setForm(p => ({ ...p, paid_by: v }))} placeholder="Owner / Manager / ..." />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn onClick={save} full disabled={saving || !form.description || !form.amount}>
              {saving ? "Saving..." : "Add Expense"}
            </Btn>
            <Btn variant="ghost" onClick={() => setModal(false)} full>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
