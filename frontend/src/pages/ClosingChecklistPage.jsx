import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { toast,Btn, Card, Modal, Field, PageHeader, Badge, Input, Spinner, Table, TD, EmptyState, Rs } from "../components/UI";

const STATUS_COLOR = { draft: "yellow", completed: "green" };

export default function ClosingChecklistPage() {
  const [view, setView] = useState("list"); // list | active
  const [checklists, setChecklists] = useState([]);
  const [active, setActive] = useState(null); // { ...checklist, entries: [] }
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [startModal, setStartModal] = useState(false);
  const [startForm, setStartForm] = useState({ date: new Date().toISOString().slice(0,10), notes: "" });
  const [saving, setSaving] = useState({});
  const [filterCat, setFilterCat] = useState("All");
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  const loadList = async () => {
    try { setLoading(true); setChecklists(await api.getChecklists()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadList(); }, []);

  const startChecklist = async () => {
    setStarting(true);
    try {
      const cl = await api.startChecklist(startForm);
      setActive(cl);
      setView("active");
      setStartModal(false);
      await loadList();
    } catch (e) { toast.error(e.message || "Failed"); } finally { setStarting(false); }
  };

  const openChecklist = async (id) => {
    setLoading(true);
    try { setActive(await api.getChecklist(id)); setView("active"); }
    catch (e) { toast.error(e.message || "Failed"); } finally { setLoading(false); }
  };

  const updateEntry = async (entry, changes) => {
    setSaving(p => ({ ...p, [entry.id]: true }));
    try {
      const updated = await api.updateEntry(active.id, entry.id, { ...entry, ...changes });
      setActive(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === entry.id ? { ...e, ...updated } : e)
      }));
    } catch (e) { console.error(e); } finally { setSaving(p => ({ ...p, [entry.id]: false })); }
  };

  const completeChecklist = async () => {
    // Show toast instead of confirm - this action is non-destructive
    toast.info("Completing checklist and generating PDFs…");
    setCompleting(true);
    try {
      const result = await api.completeChecklist(active.id);
      setCompletedResult(result);
      setActive(prev => ({ ...prev, status: "completed", pdf_path: result.pdfPath }));
      await loadList();
    } catch (e) { toast.error(e.message || "Failed"); } finally { setCompleting(false); }
  };

  // Group entries by their kitchen item's category
  const categories = active ? ["All", ...new Set(active.entries.map(e => {
    // We stored item_name, try to group by matching
    return e.category || "General";
  }))] : [];

  const displayEntries = active?.entries?.filter(e => {
    if (showOnlyIssues && e.is_available && !e.needs_reorder) return false;
    return true;
  }) || [];

  const stats = active ? {
    total: active.entries.length,
    available: active.entries.filter(e => e.is_available && !e.needs_reorder).length,
    missing: active.entries.filter(e => !e.is_available).length,
    low: active.entries.filter(e => e.is_available && e.needs_reorder).length,
  } : {};

  if (loading && view === "list") return <Spinner />;

  // ── ACTIVE CHECKLIST VIEW ─────────────────────────────────
  if (view === "active" && active) {
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={() => setView("list")} style={{ background:"transparent", border:"none", color:"#f5a623", cursor:"pointer", fontSize:13, fontWeight:600 }}>← Back</button>
              <div style={{ fontSize:22, fontWeight:800 }}>Closing Checklist</div>
              <Badge type={STATUS_COLOR[active.status] || "yellow"}>{active.status}</Badge>
            </div>
            <div style={{ color:"#8892b0", fontSize:13, marginTop:3 }}>
              📅 {String(active.date).slice(0,10)} · Checked by: {active.checked_by}
            </div>
          </div>
          {active.status === "draft" && (
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => setShowOnlyIssues(p => !p)}
                style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #2e3450", background: showOnlyIssues?"rgba(239,68,68,0.15)":"transparent", color: showOnlyIssues?"#ef4444":"#8892b0", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}
              >
                {showOnlyIssues ? "Show All" : "🔍 Issues Only"}
              </button>
              <Btn onClick={completeChecklist} disabled={completing} variant="success">
                {completing ? "Generating PDFs..." : "✅ Complete & Generate PDF"}
              </Btn>
            </div>
          )}
          {active.status === "completed" && active.pdf_path && (
            <div style={{ display:"flex", gap:10 }}>
              <a href={`http://localhost:3001/api/kitchen/pdf/${active.pdf_path}?token=${localStorage.getItem("rc_token")}`} target="_blank" rel="noreferrer">
                <Btn variant="secondary">📄 Download Checklist PDF</Btn>
              </a>
            </div>
          )}
        </div>

        {/* Completed result banner */}
        {completedResult && (
          <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:10, padding:"14px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, color:"#22c55e", marginBottom:4 }}>✅ Checklist completed! PDFs generated.</div>
              <div style={{ fontSize:13, color:"#8892b0" }}>{completedResult.reorderCount} items added to reorder list.</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <a href={`http://localhost:3001/api/kitchen/pdf/${completedResult.pdfPath}?token=${localStorage.getItem("rc_token")}`} target="_blank" rel="noreferrer">
                <Btn variant="success">📄 Checklist PDF</Btn>
              </a>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
          {[
            { label:"Total Items", val:stats.total, color:"#e8e8e8" },
            { label:"✅ Available", val:stats.available, color:"#22c55e" },
            { label:"❌ Not Available", val:stats.missing, color:"#ef4444" },
            { label:"⚠️ Low Stock", val:stats.low, color:"#f5a623" },
          ].map(s => (
            <div key={s.label} style={{ flex:1, minWidth:120, background:"#13151f", border:"1px solid #1e2235", borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontSize:11, color:"#8892b0", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Entries table */}
        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"12px 20px", borderBottom:"1px solid #1e2235", fontWeight:700, display:"flex", justifyContent:"space-between" }}>
            <span>Kitchen Items {showOnlyIssues ? "(Issues Only)" : ""}</span>
            <span style={{ color:"#8892b0", fontSize:12 }}>{displayEntries.length} shown</span>
          </div>

          {displayEntries.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#8892b0" }}>No issues found — everything is available! 🎉</div>
          ) : (
            <div>
              {/* Mobile-friendly card list */}
              {displayEntries.map(entry => (
                <EntryRow key={entry.id} entry={entry} isCompleted={active.status==="completed"} saving={saving[entry.id]} onUpdate={changes => updateEntry(entry, changes)} />
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Closing Checklists"
        subtitle="Daily kitchen closing inspection & reorder list generation"
        actions={
          <Btn onClick={() => setStartModal(true)}>＋ Start Tonight's Checklist</Btn>
        }
      />

      {checklists.length === 0 ? (
        <EmptyState icon="📋" text="No checklists yet. Start your first closing checklist." />
      ) : (
        <div>
          {checklists.map(cl => {
            const isToday = String(cl.date).slice(0,10) === new Date().toISOString().slice(0,10);
            return (
              <div key={cl.id} onClick={() => openChecklist(cl.id)}
                style={{ background:"#13151f", border:`1px solid ${isToday?"#f5a623":"#1e2235"}`, borderRadius:12, padding:"16px 20px", marginBottom:12, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="#f5a623"}
                onMouseLeave={e => e.currentTarget.style.borderColor=isToday?"#f5a623":"#1e2235"}
              >
                <div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>📋 {String(cl.date).slice(0,10)}</span>
                    <Badge type={STATUS_COLOR[cl.status]||"yellow"}>{cl.status}</Badge>
                    {isToday && <Badge type="green">Today</Badge>}
                  </div>
                  <div style={{ color:"#8892b0", fontSize:13 }}>Checked by: {cl.checked_by}</div>
                  {cl.notes && <div style={{ color:"#8892b0", fontSize:12, marginTop:2 }}>{cl.notes}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  {cl.pdf_path && <div style={{ fontSize:11, color:"#22c55e", marginBottom:4 }}>📄 PDF Ready</div>}
                  <div style={{ color:"#8892b0", fontSize:12 }}>{String(cl.created_at||"").slice(0,16)}</div>
                  <div style={{ color:"#f5a623", fontSize:12, marginTop:4, fontWeight:600 }}>Open →</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {startModal && (
        <Modal title="Start Closing Checklist" onClose={() => setStartModal(false)}>
          <div style={{ background:"rgba(245,166,35,0.08)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:8, padding:"12px 16px", marginBottom:18, fontSize:13, color:"#f5a623" }}>
            📋 This will create a checklist with all your kitchen items pre-loaded. You'll go through each one and mark available / not available.
          </div>
          <Field label="Date">
            <Input type="date" value={startForm.date} onChange={v => setStartForm(p=>({...p,date:v}))} />
          </Field>
          <Field label="Notes (optional)">
            <Input value={startForm.notes} onChange={v => setStartForm(p=>({...p,notes:v}))} placeholder="e.g. Saturday night closing" />
          </Field>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <Btn onClick={startChecklist} full disabled={starting}>{starting?"Starting...":"Start Checklist"}</Btn>
            <Btn variant="ghost" onClick={() => setStartModal(false)} full>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Single entry row component ────────────────────────────────
function EntryRow({ entry, isCompleted, saving, onUpdate }) {
  const [showDetail, setShowDetail] = useState(!entry.is_available || entry.needs_reorder);

  const rowBg = !entry.is_available ? "rgba(239,68,68,0.06)" : entry.needs_reorder ? "rgba(245,166,35,0.06)" : "transparent";
  const borderColor = !entry.is_available ? "#ef4444" : entry.needs_reorder ? "#f5a623" : "#1e2235";

  return (
    <div style={{ borderBottom:"1px solid #1a1d27", background:rowBg, borderLeft:`3px solid ${borderColor}`, padding:"12px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", flex:1 }}>
          <span style={{ fontWeight:600, fontSize:14, minWidth:120 }}>{entry.item_name}</span>
          <span style={{ fontSize:12, color:"#8892b0", background:"#1a1d27", padding:"2px 8px", borderRadius:4 }}>{entry.unit}</span>
        </div>

        {!isCompleted ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {saving && <span style={{ fontSize:12, color:"#8892b0" }}>saving…</span>}

            {/* Available toggle */}
            <button
              onClick={() => { onUpdate({ is_available: true, needs_reorder: false }); setShowDetail(false); }}
              style={{ padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, background: entry.is_available && !entry.needs_reorder ? "#22c55e" : "#1e2235", color: entry.is_available && !entry.needs_reorder ? "#0f1117" : "#8892b0" }}
            >✅ Available</button>

            <button
              onClick={() => { onUpdate({ is_available: true, needs_reorder: true }); setShowDetail(true); }}
              style={{ padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, background: entry.is_available && entry.needs_reorder ? "#f5a623" : "#1e2235", color: entry.is_available && entry.needs_reorder ? "#0f1117" : "#8892b0" }}
            >⚠️ Low Stock</button>

            <button
              onClick={() => { onUpdate({ is_available: false, needs_reorder: true }); setShowDetail(true); }}
              style={{ padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, background: !entry.is_available ? "#ef4444" : "#1e2235", color: !entry.is_available ? "#fff" : "#8892b0" }}
            >❌ Not Available</button>
          </div>
        ) : (
          <Badge type={!entry.is_available?"red":entry.needs_reorder?"yellow":"green"}>
            {!entry.is_available ? "Not Available" : entry.needs_reorder ? "Low Stock" : "Available"}
          </Badge>
        )}
      </div>

      {/* Detail row for issues */}
      {showDetail && !isCompleted && (
        <div style={{ display:"flex", gap:10, marginTop:10, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#8892b0" }}>Qty found:</span>
            <input
              type="number" min="0" step="0.5"
              defaultValue={entry.quantity_found || ""}
              onBlur={e => onUpdate({ quantity_found: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              style={{ width:70, background:"#1a1d27", border:"1px solid #2e3450", color:"#e8e8e8", borderRadius:6, padding:"4px 8px", fontFamily:"inherit", fontSize:13, outline:"none" }}
            />
            <span style={{ fontSize:12, color:"#8892b0" }}>{entry.unit}</span>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#8892b0" }}>Need to order:</span>
            <input
              type="number" min="0" step="0.5"
              defaultValue={entry.reorder_qty || ""}
              onBlur={e => onUpdate({ reorder_qty: e.target.value ? Number(e.target.value) : null })}
              placeholder="qty"
              style={{ width:70, background:"#1a1d27", border:"1px solid #2e3450", color:"#e8e8e8", borderRadius:6, padding:"4px 8px", fontFamily:"inherit", fontSize:13, outline:"none" }}
            />
            <span style={{ fontSize:12, color:"#8892b0" }}>{entry.unit}</span>
          </div>
          <div style={{ flex:1, minWidth:150, display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#8892b0" }}>Note:</span>
            <input
              type="text"
              defaultValue={entry.note || ""}
              onBlur={e => onUpdate({ note: e.target.value })}
              placeholder="Optional note"
              style={{ flex:1, background:"#1a1d27", border:"1px solid #2e3450", color:"#e8e8e8", borderRadius:6, padding:"4px 8px", fontFamily:"inherit", fontSize:13, outline:"none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
