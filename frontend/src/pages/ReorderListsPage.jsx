import { useState, useEffect } from "react";
import { api } from "../api";
import { Card, PageHeader, Badge, Spinner, Table, TD, EmptyState, Btn } from "../components/UI";

export default function ReorderListsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.getReorderLists().then(setLists).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Reorder / Shopping Lists"
        subtitle="Auto-generated from closing checklists · Download PDFs anytime"
      />

      {lists.length === 0 ? (
        <EmptyState icon="🛒" text="No reorder lists yet. Complete a closing checklist to generate one." />
      ) : (
        <div>
          {lists.map(list => {
            const items = typeof list.items === "string" ? JSON.parse(list.items) : list.items;
            const isOpen = expanded === list.id;
            return (
              <Card key={list.id} style={{ marginBottom:14, padding:0, overflow:"hidden" }}>
                {/* Header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : list.id)}
                  style={{ padding:"15px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", borderBottom: isOpen ? "1px solid #1e2235" : "none" }}
                >
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <span style={{ fontSize:22 }}>🛒</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15 }}>
                        Shopping List — {String(list.date).slice(0,10)}
                      </div>
                      <div style={{ fontSize:12, color:"#8892b0", marginTop:2 }}>
                        {items.length} items · Created by {list.created_by} · Checklist #{list.checklist_id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    {list.pdf_path && (
                      <a
                        href={`http://localhost:3001/api/kitchen/pdf/${list.pdf_path}?token=${localStorage.getItem("rc_token")}`}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                      >
                        <Btn size="sm" variant="success">📄 Download PDF</Btn>
                      </a>
                    )}
                    <div style={{ color:"#8892b0", fontSize:14 }}>{isOpen ? "▲" : "▼"}</div>
                  </div>
                </div>

                {/* Expanded items */}
                {isOpen && (
                  <div>
                    {/* Summary badges */}
                    <div style={{ padding:"10px 20px", borderBottom:"1px solid #1a1d27", display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:"#8892b0" }}>Items needed:</span>
                      {Array.from(new Set(items.map(i => i.reason))).map(r => (
                        <Badge key={r} type={r==="Not Available"?"red":"yellow"}>
                          {r}: {items.filter(i=>i.reason===r).length}
                        </Badge>
                      ))}
                    </div>

                    <Table headers={["#","Item","Unit","Qty Needed","Reason","Note"]}>
                      {items.map((item, idx) => (
                        <tr key={idx}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(245,166,35,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}
                        >
                          <TD><span style={{ color:"#8892b0", fontSize:12 }}>{idx+1}</span></TD>
                          <TD><span style={{ fontWeight:600, fontSize:14 }}>{item.name}</span></TD>
                          <TD><span style={{ background:"rgba(245,166,35,0.12)", color:"#f5a623", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:4 }}>{item.unit}</span></TD>
                          <TD>
                            {item.qty ? (
                              <span style={{ fontWeight:700, color:"#63b3ed" }}>{item.qty} {item.unit}</span>
                            ) : (
                              <span style={{ color:"#8892b0" }}>—</span>
                            )}
                          </TD>
                          <TD>
                            <Badge type={item.reason==="Not Available"?"red":"yellow"}>{item.reason}</Badge>
                          </TD>
                          <TD><span style={{ color:"#8892b0", fontSize:12 }}>{item.note||"—"}</span></TD>
                        </tr>
                      ))}
                    </Table>

                    {/* Print button */}
                    <div style={{ padding:"12px 20px", borderTop:"1px solid #1e2235", display:"flex", gap:10 }}>
                      {list.pdf_path && (
                        <a
                          href={`http://localhost:3001/api/kitchen/pdf/${list.pdf_path}?token=${localStorage.getItem("rc_token")}`}
                          target="_blank" rel="noreferrer"
                        >
                          <Btn variant="success">🖨️ Print / Download PDF</Btn>
                        </a>
                      )}
                      <span style={{ color:"#8892b0", fontSize:12, alignSelf:"center" }}>
                        PDF contains all {items.length} items formatted for printing
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
