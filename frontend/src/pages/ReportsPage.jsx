import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Card, PageHeader, Spinner, Badge, Table, TD, Rs } from "../components/UI";

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview | employees | daily | payouts

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getMonthlySummary(month));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const tabs = ["overview", "employees", "daily", "payouts"];

  if (loading) return <Spinner />;

  const dailyMap = {};
  if (data) {
    data.sales.forEach(s => { if (!dailyMap[s.date]) dailyMap[s.date] = { date: s.date, sale: 0, commissions: 0, payouts: 0, expenses: 0 }; dailyMap[s.date].sale = s.total_sale; });
    data.commissions.forEach(c => { if (!dailyMap[c.date]) dailyMap[c.date] = { date: c.date, sale: 0, commissions: 0, payouts: 0, expenses: 0 }; dailyMap[c.date].commissions = (dailyMap[c.date].commissions || 0) + c.amount; });
    data.payouts.forEach(p => { if (!dailyMap[p.date]) dailyMap[p.date] = { date: p.date, sale: 0, commissions: 0, payouts: 0, expenses: 0 }; dailyMap[p.date].payouts = (dailyMap[p.date].payouts || 0) + p.amount; });
    data.expenses.forEach(e => { if (!dailyMap[e.date]) dailyMap[e.date] = { date: e.date, sale: 0, commissions: 0, payouts: 0, expenses: 0 }; dailyMap[e.date].expenses = (dailyMap[e.date].expenses || 0) + e.amount; });
  }
  const dailyRows = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Monthly Reports"
        subtitle="Full financial summary by month"
        actions={
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }}
          />
        }
      />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#13151f", border: "1px solid #1e2235", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setView(t)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: view === t ? "#f5a623" : "transparent", color: view === t ? "#0f1117" : "#8892b0", transition: "all 0.15s" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {view === "overview" && data && (
        <div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { label: "Total Sales", value: Rs(data.totalSales), color: "#22c55e", icon: "💹" },
              { label: "Total Commissions", value: Rs(data.totalCommissions), color: "#63b3ed", icon: "👥" },
              { label: "Fixed Payouts", value: Rs(data.totalPayouts), color: "#f5a623", icon: "💵" },
              { label: "Expenses", value: Rs(data.totalExpenses), color: "#a78bfa", icon: "🧾" },
              { label: "Net Balance", value: Rs(data.remaining), color: data.remaining >= 0 ? "#22c55e" : "#ef4444", icon: "🏦" },
              { label: "Days Recorded", value: data.sales.length, color: "#e8e8e8", icon: "📅" },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, minWidth: 140, background: "#13151f", border: "1px solid #1e2235", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{c.icon} {c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Breakdown bar */}
          {data.totalSales > 0 && (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Revenue Distribution</div>
              <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                {[
                  { val: data.totalCommissions, color: "#63b3ed", label: "Commissions" },
                  { val: data.totalPayouts, color: "#f5a623", label: "Payouts" },
                  { val: data.totalExpenses, color: "#a78bfa", label: "Expenses" },
                  { val: Math.max(0, data.remaining), color: "#22c55e", label: "Remaining" },
                ].filter(s => s.val > 0).map((s, i) => (
                  <div key={i} title={`${s.label}: ${Rs(s.val)}`} style={{ width: `${(s.val / data.totalSales) * 100}%`, background: s.color, transition: "width 0.5s", minWidth: s.val > 0 ? 4 : 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { val: data.totalCommissions, color: "#63b3ed", label: "Commissions" },
                  { val: data.totalPayouts, color: "#f5a623", label: "Payouts" },
                  { val: data.totalExpenses, color: "#a78bfa", label: "Expenses" },
                  { val: Math.max(0, data.remaining), color: "#22c55e", label: "Remaining" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                    <span style={{ fontSize: 12, color: "#8892b0" }}>{s.label}: <strong style={{ color: s.color }}>{Rs(s.val)}</strong> ({data.totalSales > 0 ? Math.round(s.val / data.totalSales * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── EMPLOYEES TAB ── */}
      {view === "employees" && data && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700, fontSize: 15 }}>
            👥 Employee Commission Summary — {month}
          </div>
          {data.employeeSummary.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>No commission data for this month</div>
          ) : (
            <>
              <Table headers={["Employee", "Days Worked", "Total Commission", "Avg / Day"]}>
                {data.employeeSummary.sort((a, b) => b.total - a.total).map(e => (
                  <tr key={e.id}
                    onMouseEnter={ev => ev.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                  >
                    <TD>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${e.id * 47 % 360}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                          {(e.name || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                      </div>
                    </TD>
                    <TD><Badge type="blue">{e.days} days</Badge></TD>
                    <TD><span style={{ fontWeight: 800, color: "#63b3ed", fontSize: 16 }}>{Rs(e.total)}</span></TD>
                    <TD><span style={{ color: "#8892b0" }}>{Rs(Math.round(e.total / e.days))}</span></TD>
                  </tr>
                ))}
              </Table>
              <div style={{ padding: "10px 20px", background: "rgba(99,179,237,0.06)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8892b0", fontWeight: 600 }}>Total</span>
                <span style={{ fontWeight: 800, color: "#63b3ed" }}>{Rs(data.totalCommissions)}</span>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── DAILY TAB ── */}
      {view === "daily" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700, fontSize: 15 }}>
            📅 Daily Breakdown — {month}
          </div>
          {dailyRows.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>No data for this month</div>
          ) : (
            <Table headers={["Date", "Sale", "Commissions", "Payouts", "Expenses", "Balance"]}>
              {dailyRows.map(d => {
                const balance = d.sale - d.commissions - d.payouts - d.expenses;
                return (
                  <tr key={d.date}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <TD><span style={{ fontWeight: 600 }}>{d.date}</span></TD>
                    <TD><span style={{ color: "#22c55e", fontWeight: 700 }}>{Rs(d.sale)}</span></TD>
                    <TD><span style={{ color: "#63b3ed" }}>{Rs(d.commissions)}</span></TD>
                    <TD><span style={{ color: "#f5a623" }}>{Rs(d.payouts)}</span></TD>
                    <TD><span style={{ color: "#a78bfa" }}>{Rs(d.expenses)}</span></TD>
                    <TD><span style={{ fontWeight: 700, color: balance >= 0 ? "#22c55e" : "#ef4444" }}>{Rs(balance)}</span></TD>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* ── PAYOUTS TAB ── */}
      {view === "payouts" && data && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700, fontSize: 15 }}>
            💵 All Fixed Payouts — {month}
          </div>
          {data.payouts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892b0" }}>No payouts this month</div>
          ) : (
            <Table headers={["Date", "Recipient", "Type", "Amount", "Note"]}>
              {data.payouts.sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                <tr key={p.id}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <TD><span style={{ color: "#8892b0" }}>{p.date}</span></TD>
                  <TD><span style={{ fontWeight: 600 }}>{p.recipient}</span></TD>
                  <TD><Badge type={p.recipient_type === "owner" ? "yellow" : p.recipient_type === "manager" ? "blue" : "purple"}>{p.recipient_type}</Badge></TD>
                  <TD><span style={{ fontWeight: 700, color: "#f5a623", fontSize: 15 }}>{Rs(p.amount)}</span></TD>
                  <TD><span style={{ color: "#8892b0" }}>{p.note || "—"}</span></TD>
                </tr>
              ))}
              <tr style={{ background: "rgba(245,166,35,0.06)" }}>
                <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 700 }}>Total</td>
                <td style={{ padding: "10px 16px", fontWeight: 800, color: "#f5a623", fontSize: 15 }}>{Rs(data.totalPayouts)}</td>
                <td></td>
              </tr>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
