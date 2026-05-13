import { useState, useEffect } from "react";
import { api } from "../api";
import { Btn, Card, Modal, Field, PageHeader, Badge, Input, Select, Spinner, Table, TD, EmptyState } from "../components/UI";

const CATEGORIES = ["Meat", "Vegetables", "Spices", "Dry Goods", "Dairy", "Pulses", "Beverages", "Supplies", "Utilities", "General"];
const UNITS = ["kg", "g", "litre", "ml", "pcs", "pkt", "dozen", "bag", "box", "tin", "bottle", "bundle"];

const CAT_COLORS = { Meat:"red", Vegetables:"green", Spices:"yellow", "Dry Goods":"blue", Dairy:"purple", Pulses:"blue", Beverages:"green", Supplies:"purple", Utilities:"yellow", General:"blue" };

export default function KitchenItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", category: "General", unit: "kg", min_quantity: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const load = async () => {
    try { setLoading(true); setItems(await api.getKitchenItems()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: "", category: "General", unit: "kg", min_quantity: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ name: item.name, category: item.category, unit: item.unit, min_quantity: item.min_quantity || "" }); setModal(item.id); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (modal === "add") await api.addKitchenItem(form);
      else await api.updateKitchenItem(modal, form);
      await load(); setModal(null);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from kitchen items?`)) return;
    await api.deleteKitchenItem(id); load();
  };

  // Group by category
  const cats = ["All", ...CATEGORIES];
  const filtered = items.filter(i =>
    (filterCat === "All" || i.category === filterCat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()))
  );
  const grouped = {};
  filtered.forEach(i => { if (!grouped[i.category]) grouped[i.category] = []; grouped[i.category].push(i); });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Kitchen Items"
        subtitle={`${items.length} items in your kitchen master list`}
        actions={<Btn onClick={openAdd}>＋ Add Item</Btn>}
      />

      {/* Search + filter bar */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search items..."
          style={{ background:"#1e2235", border:"1px solid #2e3450", color:"#e8e8e8", borderRadius:8, padding:"9px 14px", fontFamily:"inherit", fontSize:13, outline:"none", flex:1, minWidth:180 }}
        />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding:"7px 14px", borderRadius:8, border:"none", fontFamily:"inherit", fontSize:12, fontWeight:600,
              background: filterCat===c ? "#f5a623" : "#1e2235",
              color: filterCat===c ? "#0f1117" : "#8892b0", cursor:"pointer"
            }}>{c}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🥬" text="No items found. Add kitchen ingredients to get started." />
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <Card key={cat} style={{ marginBottom:16, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #1e2235", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1a1d27" }}>
              <div style={{ fontWeight:700, fontSize:14 }}>
                <Badge type={CAT_COLORS[cat] || "blue"}>{cat}</Badge>
                <span style={{ color:"#8892b0", fontSize:12, marginLeft:10 }}>{catItems.length} items</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12, padding:16 }}>
              {catItems.map(item => (
                <div key={item.id} style={{ background:"#1a1d27", borderRadius:10, padding:"12px 14px", border:"1px solid #2e3450", display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => openEdit(item)} style={{ background:"transparent", border:"none", color:"#8892b0", cursor:"pointer", fontSize:14, padding:"2px 4px" }}>✏️</button>
                      <button onClick={() => remove(item.id, item.name)} style={{ background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, padding:"2px 4px" }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ background:"rgba(245,166,35,0.12)", color:"#f5a623", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:4 }}>{item.unit}</span>
                    {item.min_quantity > 0 && (
                      <span style={{ color:"#8892b0", fontSize:11 }}>Min: {item.min_quantity} {item.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      {modal && (
        <Modal title={modal === "add" ? "Add Kitchen Item" : "Edit Kitchen Item"} onClose={() => setModal(null)}>
          <Field label="Item Name">
            <Input value={form.name} onChange={v => setForm(p=>({...p,name:v}))} placeholder="e.g. Chicken, Hari Mirch, Cooking Oil" />
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Category">
              <Select value={form.category} onChange={v => setForm(p=>({...p,category:v}))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={v => setForm(p=>({...p,unit:v}))}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Minimum Quantity (reorder alert)">
            <Input type="number" value={form.min_quantity} onChange={v => setForm(p=>({...p,min_quantity:v}))} placeholder="e.g. 2 (kg/pcs/litre)" min="0" step="0.5" />
          </Field>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <Btn onClick={save} full disabled={saving||!form.name}>{saving ? "Saving..." : modal==="add"?"Add Item":"Save Changes"}</Btn>
            <Btn variant="ghost" onClick={()=>setModal(null)} full>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
