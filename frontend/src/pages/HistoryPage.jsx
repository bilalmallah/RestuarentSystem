import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Card, PageHeader, Badge, Spinner, Table, TD, Rs } from "../components/UI";

export default function HistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getEmployees().then(setEmployees).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month };
      if (selected) params.employee_id = selected;
      const [c, p] = await Promise.all([
        api.getCommissions(params),
        selected ? Promise.resolve([]) : api.getPayouts({ month }),
      ]);
      setCommissions(c);
      setPayouts(p);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, selected]);

  useEffect(() => { load(); }, [load]);

  const totalComm = commissions.reduce((s,c) => s + c.amount, 0);
  const totalPay = payouts.reduce((s,p) => s + p.amount, 0);

  // Group commissions by date
  const byDate = {};
  commissions.forEach(c => {
    if (!byDate[c.date]) byDate[c.date] = [];
    byDate[c.date].push(c);
  });
  payouts.forEach(p => {
    if (!byDate[p.date]) byDate[p.date] = [];
    byDate[p.date].push({ ...p, _isPayout: true });
  });
  const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  return (
    <div>
      <PageHeader
        title="Commission History"
        subtitle="View all commission records per employee or per month"
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selected || ""}
              onChange={e => setSelected(e.target.value ? Number(e.target.value) : null)}
              style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }}
            >
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }}
            />
          </div>
        }
      />

      {/* Summary row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex:1, minWidth:130, background:"#13151f", border:"1px solid #1e2235", borderRadius:10, padding:"14px 18px" }}>
          <div style={{ fontSize:11, color:"#8892b0", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>👥 Total Commissions</div>
          <div style={{ fontSize:24, fontWeight:800, color:"#63b3ed", marginTop:4 }}>{Rs(totalComm)}</div>
          <div style={{ fontSize:12, color:"#8892b0", marginTop:2 }}>{commissions.length} records</div>
        </div>
        {!selected && (
          <div style={{ flex:1, minWidth:130, background:"#13151f", border:"1px solid #1e2235", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, color:"#8892b0", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>💵 Total Payouts</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#f5a623", marginTop:4 }}>{Rs(totalPay)}</div>
            <div style={{ fontSize:12, color:"#8892b0", marginTop:2 }}>{payouts.length} records</div>
          </div>
        )}
        <div style={{ flex:1, minWidth:130, background:"#13151f", border:"1px solid #1e2235", borderRadius:10, padding:"14px 18px" }}>
          <div style={{ fontSize:11, color:"#8892b0", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>📅 Days Active</div>
          <div style={{ fontSize:24, fontWeight:800, color:"#22c55e", marginTop:4 }}>{dates.length}</div>
        </div>
      </div>

      {/* Per-employee summary cards (when viewing all) */}
      {!selected && employees.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight:700, marginBottom:14 }}>Employee Summary — {month}</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {employees.map(emp => {
              const empComms = commissions.filter(c => c.employee_id === emp.id);
              const total = empComms.reduce((s,c) => s+c.amount, 0);
              const days = empComms.length;
              if (!days) return null;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelected(emp.id)}
                  style={{ background:"#1a1d27", borderRadius:10, padding:"12px 16px", cursor:"pointer", border:"1px solid #2e3450", minWidth:160, transition:"border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#f5a623"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#2e3450"}
                >
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:`hsl(${emp.id*47%360},60%,35%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                      {emp.name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight:600, fontSize:13 }}>{emp.name}</span>
                  </div>
                  <div style={{ fontWeight:800, color:"#63b3ed", fontSize:18 }}>{Rs(total)}</div>
                  <div style={{ fontSize:11, color:"#8892b0", marginTop:2 }}>{days} days · avg {Rs(Math.round(total/days))}/day</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : dates.length === 0 ? (
        <div style={{ textAlign:"center", padding:"50px 20px", color:"#8892b0" }}>
          <div style={{ fontSize:40, opacity:0.3, marginBottom:12 }}>📋</div>
          <div>No records found for {selected ? employees.find(e=>e.id===selected)?.name : "any employee"} in {month}</div>
        </div>
      ) : (
        <div>
          {dates.map(date => {
            const rows = byDate[date];
            const dayTotal = rows.reduce((s,r) => s + r.amount, 0);
            return (
              <Card key={date} style={{ marginBottom:12, padding:0, overflow:"hidden" }}>
                <div style={{ padding:"11px 20px", borderBottom:"1px solid #1e2235", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1a1d27" }}>
                  <span style={{ fontWeight:700, fontSize:14 }}>📅 {date}</span>
                  <span style={{ fontWeight:800, color:"#f5a623" }}>{Rs(dayTotal)}</span>
                </div>
                <Table headers={["Person", "Type", "Amount", "Note", "Recorded By"]}>
                  {rows.map((r, i) => (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(245,166,35,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}
                    >
                      <TD>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <div style={{ width:28, height:28, borderRadius:"50%", background:`hsl(${(r.employee_id||r.id||1)*47%360},60%,35%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
                            {(r.employee_name||r.recipient||"?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight:600 }}>{r.employee_name || r.recipient}</span>
                        </div>
                      </TD>
                      <TD>
                        {r._isPayout
                          ? <Badge type={r.recipient_type==="owner"?"yellow":r.recipient_type==="manager"?"blue":"purple"}>{r.recipient_type}</Badge>
                          : <Badge type="blue">Commission</Badge>
                        }
                      </TD>
                      <TD><span style={{ fontWeight:700, color: r._isPayout?"#f5a623":"#63b3ed", fontSize:15 }}>{Rs(r.amount)}</span></TD>
                      <TD><span style={{ color:"#8892b0" }}>{r.note || "—"}</span></TD>
                      <TD><span style={{ color:"#8892b0", fontSize:12 }}>{r.recorded_by || "—"}</span></TD>
                    </tr>
                  ))}
                </Table>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
