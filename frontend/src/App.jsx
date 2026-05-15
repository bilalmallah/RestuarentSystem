import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import CommissionsPage from "./pages/CommissionsPage";
import ReportsPage from "./pages/ReportsPage";
import ExpensesPage from "./pages/ExpensesPage";
import HistoryPage from "./pages/HistoryPage";
import KitchenItemsPage from "./pages/KitchenItemsPage";
import ClosingChecklistPage from "./pages/ClosingChecklistPage";
import ReorderListsPage from "./pages/ReorderListsPage";
import CreditPersonsPage from "./pages/CreditPersonsPage";
import CreditLedgerPage from "./pages/CreditLedgerPage";

const NAV = [
  { section: "FINANCE" },
  { id: "dashboard",    label: "Dashboard",           icon: "🏠" },
  { id: "commissions",  label: "Daily Commissions",   icon: "💰" },
  { id: "history",      label: "Commission History",  icon: "📋" },
  { id: "employees",    label: "Employees",           icon: "👥" },
  { id: "expenses",     label: "Expenses",            icon: "🧾" },
  { id: "reports",      label: "Monthly Reports",     icon: "📊" },
  { section: "CREDIT" },
  { id: "credit",       label: "Khata / Credit Book", icon: "💳" },
  { section: "KITCHEN" },
  { id: "kitchen-items",      label: "Kitchen Items",       icon: "🥬" },
  { id: "closing-checklist",  label: "Closing Checklist",   icon: "✅" },
  { id: "reorder-lists",      label: "Reorder / Shopping",  icon: "🛒" },
];

export default function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [selectedCreditPerson, setSelectedCreditPerson] = useState(null);

  if (!user) return <LoginPage />;

  const handleNavClick = (id) => {
    setPage(id);
    if (id !== "credit") setSelectedCreditPerson(null);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":          return <DashboardPage />;
      case "commissions":        return <CommissionsPage />;
      case "history":            return <HistoryPage />;
      case "employees":          return <EmployeesPage />;
      case "expenses":           return <ExpensesPage />;
      case "reports":            return <ReportsPage />;
      case "credit":
        return selectedCreditPerson
          ? <CreditLedgerPage
              person={selectedCreditPerson}
              onBack={() => setSelectedCreditPerson(null)}
            />
          : <CreditPersonsPage
              onSelectPerson={(p) => setSelectedCreditPerson(p)}
            />;
      case "kitchen-items":      return <KitchenItemsPage />;
      case "closing-checklist":  return <ClosingChecklistPage />;
      case "reorder-lists":      return <ReorderListsPage />;
      default:                   return <DashboardPage />;
    }
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0f1117", color:"#e8e8e8", fontFamily:"'Outfit', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width:240, background:"#0d0f1a", borderRight:"1px solid #1e2235", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:100, overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid #1e2235", flexShrink:0 }}>
          <div style={{ fontSize:19, fontWeight:800, color:"#f5a623" }}>🍽 RestaurantOS</div>
          <div style={{ fontSize:11, color:"#8892b0", marginTop:2 }}>v2.0 · PostgreSQL</div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, padding:"8px 0" }}>
          {NAV.map((n, i) => {
            if (n.section) return (
              <div key={i} style={{ padding:"14px 20px 5px", fontSize:10, color:"#4a5568", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>
                {n.section}
              </div>
            );
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => handleNavClick(n.id)} style={{
                display:"flex", alignItems:"center", gap:10,
                width:"100%", padding:"10px 20px",
                background: active ? "rgba(245,166,35,0.1)" : "transparent",
                border:"none",
                borderLeft: active ? "3px solid #f5a623" : "3px solid transparent",
                color: active ? "#f5a623" : "#8892b0",
                cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400,
                fontFamily:"Outfit, sans-serif", transition:"all 0.12s", textAlign:"left",
              }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </div>

        {/* User footer */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid #1e2235", flexShrink:0 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background: user.role==="owner"?"#f5a623":"#63b3ed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#0f1117", flexShrink:0 }}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{user.name}</div>
              <div style={{ fontSize:11, color:"#8892b0", textTransform:"capitalize" }}>{user.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", cursor:"pointer", fontSize:12, fontFamily:"Outfit, sans-serif", fontWeight:600, borderRadius:6, padding:"6px 12px", width:"100%" }}>
            ↩ Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft:240, flex:1, padding:"28px 32px", overflowY:"auto", minHeight:"100vh" }}>
        {renderPage()}
      </div>
    </div>
  );
}
