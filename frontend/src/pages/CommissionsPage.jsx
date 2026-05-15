import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Btn, Card, Modal, Field, PageHeader, Badge, Input, Select, Spinner, Table, TD, Rs, toast, useDeleteConfirm } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const TODAY = () => new Date().toISOString().slice(0, 10);

export default function CommissionsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(TODAY());
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saleInput, setSaleInput] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [savingSale, setSavingSale] = useState(false);

  // Commission modal
  const [commModal, setCommModal] = useState(null); // null | "add" | commission_id
  const [commForm, setCommForm] = useState({ employee_id: "", amount: "", note: "" });
  const [savingComm, setSavingComm] = useState(false);
  const { confirm, modal: deleteModal } = useDeleteConfirm();

  // Payout modal
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ recipient: "", recipient_type: "owner", amount: "", note: "" });
  const [savingPayout, setSavingPayout] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, sum] = await Promise.all([
        api.getEmployees(),
        api.getDailySummary(date),
      ]);
      setEmployees(emps);
      setSummary(sum);
      setSaleInput(sum.sale?.total_sale || "");
      setSaleNote(sum.sale?.note || "");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const saveSale = async () => {
    if (!saleInput) return;
    setSavingSale(true);
    try {
      await api.saveSale({ date, total_sale: Number(saleInput), note: saleNote });
      await load();
    } catch (e) { toast.error(e.message || "Failed"); }
    finally { setSavingSale(false); }
  };

  const openAddComm = () => {
    setCommForm({ employee_id: employees[0]?.id || "", amount: "", note: "" });
    setCommModal("add");
  };

  const saveCommission = async () => {
    if (!commForm.employee_id || !commForm.amount) return;
    const emp = employees.find(e => e.id === Number(commForm.employee_id));
    setSavingComm(true);
    try {
      await api.saveCommission({
        date,
        employee_id: Number(commForm.employee_id),
        employee_name: emp?.name || "",
        amount: Number(commForm.amount),
        note: commForm.note,
      });
      await load();
      setCommModal(null);
    } catch (e) { toast.error(e.message || "Failed"); }
    finally { setSavingComm(false); }
  };

  const deleteComm = async (id) => {
    const ok1 = await confirm("this commission entry");
    if (!ok1) return;
    await api.deleteCommission(id);
    load();
  };

  const savePayout = async () => {
    if (!payoutForm.recipient || !payoutForm.amount) return;
    setSavingPayout(true);
    try {
      await api.addPayout({ date, ...payoutForm, amount: Number(payoutForm.amount) });
      await load();
      setPayoutModal(false);
      setPayoutForm({ recipient: "", recipient_type: "owner", amount: "", note: "" });
    } catch (e) { toast.error(e.message || "Failed"); }
    finally { setSavingPayout(false); }
  };

  const deletePayout = async (id) => {
    const ok2 = await confirm("this payout");
    if (!ok2) return;
    await api.deletePayout(id);
    load();
  };

  const quickPayouts = [
    { label: "Owner", type: "owner" },
    { label: "Manager", type: "manager" },
  ];

  const recipientTypes = ["owner", "manager", "chef", "partner", "other"];

  return (
    <div>
      {deleteModal}
      <PageHeader
        title="Daily Commission Entry"
        subtitle={`Record today's sales, employee commissions & fixed payouts`}
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }}
            />
          </div>
        }
      />

      {/* ── DAILY SALE SECTION ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          💰 Today's Total Sale
          {summary?.sale && <Badge type="green">Saved</Badge>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8892b0", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Sale Amount (Rs)</label>
            <Input type="number" value={saleInput} onChange={setSaleInput} placeholder="e.g. 85000" min="0" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8892b0", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Note (optional)</label>
            <Input value={saleNote} onChange={setSaleNote} placeholder="e.g. Weekend rush, catering event" />
          </div>
          <Btn onClick={saveSale} disabled={savingSale || !saleInput} variant="success">
            {savingSale ? "Saving..." : summary?.sale ? "Update Sale" : "Save Sale"}
          </Btn>
        </div>
      </Card>

      {/* ── SUMMARY CARDS ── */}
      {summary && (
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total Sale", value: Rs(summary.totalSale), color: "#22c55e", icon: "💹" },
            { label: "Commissions", value: Rs(summary.totalCommissions), color: "#63b3ed", icon: "👥" },
            { label: "Fixed Payouts", value: Rs(summary.totalPayouts), color: "#f5a623", icon: "💵" },
            { label: "Expenses", value: Rs(summary.totalExpenses), color: "#a78bfa", icon: "🧾" },
            { label: "Remaining", value: Rs(summary.remaining), color: summary.remaining >= 0 ? "#22c55e" : "#ef4444", icon: "🏦" },
          ].map(c => (
            <div key={c.label} style={{ flex: 1, minWidth: 130, background: "#13151f", border: "1px solid #1e2235", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{c.icon} {c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* ── EMPLOYEE COMMISSIONS ── */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>👥 Employee Commissions</div>
            <Btn size="sm" onClick={openAddComm}>＋ Add</Btn>
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: "#8892b0" }}>Loading...</div>
          ) : summary?.commissions?.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 30, opacity: 0.3, marginBottom: 8 }}>📋</div>
              <div style={{ color: "#8892b0", fontSize: 13 }}>No commissions recorded yet</div>
              <div style={{ marginTop: 12 }}>
                <Btn size="sm" onClick={openAddComm}>Record First Commission</Btn>
              </div>
            </div>
          ) : (
            <>
              {summary?.commissions?.map(c => {
                const emp = employees.find(e => e.id === c.employee_id);
                return (
                  <div key={c.id} style={{ padding: "12px 20px", borderBottom: "1px solid #1a1d27", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(c.employee_id || 1) * 47 % 360}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {(c.employee_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.employee_name}</div>
                        {c.note && <div style={{ fontSize: 12, color: "#8892b0" }}>{c.note}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#63b3ed" }}>{Rs(c.amount)}</div>
                      <Btn size="sm" variant="danger" onClick={() => deleteComm(c.id)}>✕</Btn>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: "10px 20px", background: "rgba(99,179,237,0.06)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8892b0", fontSize: 13 }}>Total Commissions</span>
                <span style={{ fontWeight: 800, color: "#63b3ed" }}>{Rs(summary?.totalCommissions)}</span>
              </div>
            </>
          )}
        </Card>

        {/* ── FIXED PAYOUTS ── */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>💵 Fixed Payouts</div>
            <Btn size="sm" onClick={() => setPayoutModal(true)}>＋ Add</Btn>
          </div>

          {/* Quick-add buttons */}
          <div style={{ padding: "10px 20px", borderBottom: "1px solid #1a1d27", display: "flex", gap: 8 }}>
            {quickPayouts.map(q => (
              <Btn key={q.type} size="sm" variant="ghost" onClick={() => { setPayoutForm({ recipient: q.label, recipient_type: q.type, amount: "", note: "" }); setPayoutModal(true); }}>
                + {q.label}
              </Btn>
            ))}
          </div>

          {summary?.payouts?.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center" }}>
              <div style={{ color: "#8892b0", fontSize: 13 }}>No payouts recorded</div>
              <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>e.g. Owner: 50,000 · Manager: 2,000</div>
            </div>
          ) : (
            <>
              {summary?.payouts?.map(p => (
                <div key={p.id} style={{ padding: "12px 20px", borderBottom: "1px solid #1a1d27", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      {p.recipient}
                      <Badge type={p.recipient_type === "owner" ? "yellow" : p.recipient_type === "manager" ? "blue" : "purple"}>
                        {p.recipient_type}
                      </Badge>
                    </div>
                    {p.note && <div style={{ fontSize: 12, color: "#8892b0" }}>{p.note}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#f5a623" }}>{Rs(p.amount)}</div>
                    <Btn size="sm" variant="danger" onClick={() => deletePayout(p.id)}>✕</Btn>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 20px", background: "rgba(245,166,35,0.06)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8892b0", fontSize: 13 }}>Total Payouts</span>
                <span style={{ fontWeight: 800, color: "#f5a623" }}>{Rs(summary?.totalPayouts)}</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── FULL DAY BREAKDOWN TABLE ── */}
      {summary && (summary.commissions?.length > 0 || summary.payouts?.length > 0) && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700, fontSize: 15 }}>
            📊 Full Day Breakdown — {date}
          </div>
          <Table headers={["Person / Role", "Type", "Amount", "Note"]}>
            {summary.commissions?.map(c => (
              <tr key={`c-${c.id}`}>
                <TD><span style={{ fontWeight: 600 }}>{c.employee_name}</span></TD>
                <TD><Badge type="blue">Commission</Badge></TD>
                <TD><span style={{ fontWeight: 700, color: "#63b3ed" }}>{Rs(c.amount)}</span></TD>
                <TD><span style={{ color: "#8892b0" }}>{c.note || "—"}</span></TD>
              </tr>
            ))}
            {summary.payouts?.map(p => (
              <tr key={`p-${p.id}`}>
                <TD><span style={{ fontWeight: 600 }}>{p.recipient}</span></TD>
                <TD><Badge type={p.recipient_type === "owner" ? "yellow" : "purple"}>{p.recipient_type}</Badge></TD>
                <TD><span style={{ fontWeight: 700, color: "#f5a623" }}>{Rs(p.amount)}</span></TD>
                <TD><span style={{ color: "#8892b0" }}>{p.note || "—"}</span></TD>
              </tr>
            ))}
            {summary.expenses?.map(e => (
              <tr key={`e-${e.id}`}>
                <TD><span style={{ fontWeight: 600 }}>{e.description}</span></TD>
                <TD><Badge type="purple">Expense</Badge></TD>
                <TD><span style={{ fontWeight: 700, color: "#a78bfa" }}>{Rs(e.amount)}</span></TD>
                <TD><span style={{ color: "#8892b0" }}>{e.category}</span></TD>
              </tr>
            ))}
            <tr style={{ background: "rgba(34,197,94,0.04)" }}>
              <TD><span style={{ fontWeight: 700 }}>TOTAL SALE</span></TD>
              <TD></TD>
              <TD><span style={{ fontWeight: 800, fontSize: 16, color: "#22c55e" }}>{Rs(summary.totalSale)}</span></TD>
              <TD></TD>
            </tr>
            <tr style={{ background: "rgba(239,68,68,0.04)" }}>
              <TD><span style={{ fontWeight: 700 }}>REMAINING / BALANCE</span></TD>
              <TD></TD>
              <TD><span style={{ fontWeight: 800, fontSize: 16, color: summary.remaining >= 0 ? "#22c55e" : "#ef4444" }}>{Rs(summary.remaining)}</span></TD>
              <TD></TD>
            </tr>
          </Table>
        </Card>
      )}

      {/* ── COMMISSION MODAL ── */}
      {commModal && (
        <Modal title="Record Employee Commission" onClose={() => setCommModal(null)}>
          <Field label="Employee">
            <Select value={commForm.employee_id} onChange={v => setCommForm(p => ({ ...p, employee_id: v }))}>
              <option value="">— Select Employee —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role || "Staff"})</option>
              ))}
            </Select>
          </Field>
          <Field label="Commission Amount (Rs)">
            <Input type="number" value={commForm.amount} onChange={v => setCommForm(p => ({ ...p, amount: v }))} placeholder="e.g. 1200" min="0" />
          </Field>
          <Field label="Note (optional)">
            <Input value={commForm.note} onChange={v => setCommForm(p => ({ ...p, note: v }))} placeholder="e.g. Good service today" />
          </Field>
          <div style={{ background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#63b3ed" }}>
            ℹ️ If a commission already exists for this employee on {date}, it will be updated.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={saveCommission} full disabled={savingComm || !commForm.employee_id || !commForm.amount}>
              {savingComm ? "Saving..." : "Save Commission"}
            </Btn>
            <Btn variant="ghost" onClick={() => setCommModal(null)} full>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* ── PAYOUT MODAL ── */}
      {payoutModal && (
        <Modal title="Record Fixed Payout" onClose={() => setPayoutModal(false)}>
          <Field label="Recipient Name">
            <Input value={payoutForm.recipient} onChange={v => setPayoutForm(p => ({ ...p, recipient: v }))} placeholder="e.g. Owner, Manager, Chef Ali" />
          </Field>
          <Field label="Recipient Type">
            <Select value={payoutForm.recipient_type} onChange={v => setPayoutForm(p => ({ ...p, recipient_type: v }))}>
              {recipientTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Amount (Rs)">
            <Input type="number" value={payoutForm.amount} onChange={v => setPayoutForm(p => ({ ...p, amount: v }))} placeholder="e.g. 50000" min="0" />
          </Field>
          <Field label="Note (optional)">
            <Input value={payoutForm.note} onChange={v => setPayoutForm(p => ({ ...p, note: v }))} placeholder="e.g. Weekly owner payout" />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={savePayout} full disabled={savingPayout || !payoutForm.recipient || !payoutForm.amount}>
              {savingPayout ? "Saving..." : "Record Payout"}
            </Btn>
            <Btn variant="ghost" onClick={() => setPayoutModal(false)} full>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
