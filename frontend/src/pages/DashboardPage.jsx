import { useState, useEffect } from "react";
import { api } from "../api";
import { Card, Spinner, Rs, Badge } from "../components/UI";

const TODAY = () => new Date().toISOString().slice(0, 10);
const THIS_MONTH = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`; };

export default function DashboardPage() {
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, m, emps] = await Promise.all([
          api.getDailySummary(TODAY()),
          api.getMonthlySummary(THIS_MONTH()),
          api.getEmployees(),
        ]);
        setDaily(d);
        setMonthly(m);
        setEmployees(emps);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner />;

  const today = TODAY();
  const month = THIS_MONTH();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#e8e8e8" }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "#8892b0", marginTop: 3 }}>
          {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Today's stats */}
      <div style={{ marginBottom: 8, fontSize: 11, color: "#8892b0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Today — {today}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Today's Sale", value: Rs(daily?.totalSale || 0), color: "#22c55e", icon: "💹" },
          { label: "Commissions Out", value: Rs(daily?.totalCommissions || 0), color: "#63b3ed", icon: "👥" },
          { label: "Payouts", value: Rs(daily?.totalPayouts || 0), color: "#f5a623", icon: "💵" },
          { label: "Balance", value: Rs(daily?.remaining || 0), color: (daily?.remaining || 0) >= 0 ? "#22c55e" : "#ef4444", icon: "🏦" },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, minWidth: 140, background: "#13151f", border: "1px solid #1e2235", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* This month's stats */}
      <div style={{ marginBottom: 8, fontSize: 11, color: "#8892b0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>This Month — {month}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Total Sales", value: Rs(monthly?.totalSales || 0), color: "#22c55e", icon: "📈" },
          { label: "Total Commissions", value: Rs(monthly?.totalCommissions || 0), color: "#63b3ed", icon: "👥" },
          { label: "Fixed Payouts", value: Rs(monthly?.totalPayouts || 0), color: "#f5a623", icon: "💵" },
          { label: "Expenses", value: Rs(monthly?.totalExpenses || 0), color: "#a78bfa", icon: "🧾" },
          { label: "Net Balance", value: Rs(monthly?.remaining || 0), color: (monthly?.remaining || 0) >= 0 ? "#22c55e" : "#ef4444", icon: "🏦" },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, minWidth: 130, background: "#13151f", border: "1px solid #1e2235", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Today's activity */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700 }}>📋 Today's Commissions</div>
          {daily?.commissions?.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#8892b0", fontSize: 13 }}>No commissions recorded today</div>
          ) : daily?.commissions?.map(c => (
            <div key={c.id} style={{ padding: "11px 20px", borderBottom: "1px solid #1a1d27", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600 }}>{c.employee_name}</div>
              <span style={{ fontWeight: 700, color: "#63b3ed" }}>{Rs(c.amount)}</span>
            </div>
          ))}
        </Card>

        {/* Monthly employee leaderboard */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700 }}>🏆 Top Earners This Month</div>
          {monthly?.employeeSummary?.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#8892b0", fontSize: 13 }}>No data yet</div>
          ) : monthly?.employeeSummary?.sort((a, b) => b.total - a.total).slice(0, 6).map((e, i) => (
            <div key={e.id} style={{ padding: "11px 20px", borderBottom: "1px solid #1a1d27", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][i] || "🔹"}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#8892b0" }}>{e.days} days</div>
                </div>
              </div>
              <span style={{ fontWeight: 800, color: "#63b3ed" }}>{Rs(e.total)}</span>
            </div>
          ))}
        </Card>

        {/* Active employees */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700 }}>👥 Active Employees ({employees.length})</div>
          {employees.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#8892b0", fontSize: 13 }}>No employees yet</div>
          ) : employees.map(e => (
            <div key={e.id} style={{ padding: "10px 20px", borderBottom: "1px solid #1a1d27", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `hsl(${e.id * 47 % 360}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {e.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
              </div>
              <Badge type="blue">{e.role || "Staff"}</Badge>
            </div>
          ))}
        </Card>

        {/* Today's payouts */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700 }}>💵 Today's Payouts</div>
          {daily?.payouts?.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#8892b0", fontSize: 13 }}>No payouts recorded today</div>
          ) : daily?.payouts?.map(p => (
            <div key={p.id} style={{ padding: "11px 20px", borderBottom: "1px solid #1a1d27", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.recipient}</div>
                <Badge type={p.recipient_type === "owner" ? "yellow" : "blue"}>{p.recipient_type}</Badge>
              </div>
              <span style={{ fontWeight: 700, color: "#f5a623" }}>{Rs(p.amount)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
