import { useState, useEffect } from "react";
import { api } from "../api";
import { Btn, Card, Modal, Field, PageHeader, Badge, Input, Select, Spinner, EmptyState, Table, TD } from "../components/UI";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | employee_id
  const [form, setForm] = useState({ name: "", role: "Staff", phone: "", joined_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setEmployees(await api.getEmployees());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: "", role: "Staff", phone: "", joined_date: new Date().toISOString().slice(0, 10) });
    setModal("add");
  };

  const openEdit = (emp) => {
    setForm({ name: emp.name, role: emp.role || "Staff", phone: emp.phone || "", joined_date: emp.joined_date || "" });
    setModal(emp.id);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (modal === "add") await api.addEmployee(form);
      else await api.updateEmployee(modal, form);
      await load();
      setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name}? Their commission records will be kept.`)) return;
    await api.deleteEmployee(id);
    load();
  };

  const roles = ["Owner", "Manager", "Chef", "Cook", "Waiter", "Cashier", "Cleaner", "Helper", "Driver", "Security", "Staff"];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} active staff — no fixed salary, commission-based`}
        actions={<Btn onClick={openAdd}>＋ Add Employee</Btn>}
      />

      {employees.length === 0 ? (
        <EmptyState icon="👤" text="No employees yet. Add your first staff member." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
          {employees.map(emp => (
            <Card key={emp.id} style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `hsl(${emp.id * 47 % 360}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {emp.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</div>
                    <Badge type="blue">{emp.role || "Staff"}</Badge>
                  </div>
                </div>
              </div>
              {emp.phone && <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 4 }}>📞 {emp.phone}</div>}
              <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 16 }}>📅 Joined: {emp.joined_date || "—"}</div>
              <div style={{ background: "#1a1d27", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#8892b0" }}>💰 Commission-based (no fixed salary)</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(emp)} full>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => remove(emp.id, emp.name)}>✕</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {employees.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235", fontWeight: 700 }}>All Employees</div>
          <Table headers={["Name", "Role", "Phone", "Joined", "Actions"]}>
            {employees.map(emp => (
              <tr key={emp.id} style={{ transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,166,35,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <TD><span style={{ fontWeight: 600 }}>{emp.name}</span></TD>
                <TD><Badge type="blue">{emp.role || "Staff"}</Badge></TD>
                <TD><span style={{ color: "#8892b0" }}>{emp.phone || "—"}</span></TD>
                <TD><span style={{ color: "#8892b0" }}>{emp.joined_date || "—"}</span></TD>
                <TD>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(emp)}>Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={() => remove(emp.id, emp.name)}>Remove</Btn>
                  </div>
                </TD>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Add Employee" : "Edit Employee"} onClose={() => setModal(null)}>
          <Field label="Full Name">
            <Input value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Ali Hassan" />
          </Field>
          <Field label="Role / Position">
            <Select value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Phone Number">
            <Input value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="e.g. 03001234567" />
          </Field>
          <Field label="Joining Date">
            <Input type="date" value={form.joined_date} onChange={v => setForm(p => ({ ...p, joined_date: v }))} />
          </Field>
          <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f5a623" }}>
            ℹ️ No fixed salary — commissions are recorded separately per day
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save} full disabled={saving}>{saving ? "Saving..." : modal === "add" ? "Add Employee" : "Save Changes"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(null)} full>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
