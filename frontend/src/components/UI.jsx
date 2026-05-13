// ── Shared UI Components ──────────────────────────────────────

export function Btn({ children, onClick, variant = "primary", size = "md", full, disabled, type = "button" }) {
  const styles = {
    primary: { background: "#f5a623", color: "#0f1117", border: "none" },
    danger: { background: "#ef4444", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#8892b0", border: "1px solid #2e3450" },
    secondary: { background: "#1e2235", color: "#e8e8e8", border: "1px solid #2e3450" },
    success: { background: "#22c55e", color: "#0f1117", border: "none" },
  };
  const pad = size === "sm" ? "5px 12px" : size === "lg" ? "13px 28px" : "9px 18px";
  const fz = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: pad,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        fontWeight: 600,
        fontSize: fz,
        width: full ? "100%" : "auto",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s, transform 0.1s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "#13151f", border: "1px solid #1e2235", borderRadius: 12, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#13151f", border: "1px solid #2e3450", borderRadius: 14, padding: 28, width: wide ? 720 : 480, maxHeight: "90vh", overflowY: "auto", maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8892b0", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: "#8892b0", marginBottom: 5, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {children}
      {error && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#e8e8e8" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "#8892b0", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, color = "#f5a623", icon, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8892b0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 5, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "#8892b0", marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 26, opacity: 0.6 }}>{icon}</div>}
      </div>
    </Card>
  );
}

export function Badge({ children, type = "blue" }) {
  const colors = {
    green: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    red: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    yellow: { bg: "rgba(245,166,35,0.15)", color: "#f5a623" },
    blue: { bg: "rgba(99,179,237,0.15)", color: "#63b3ed" },
    purple: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
  };
  const c = colors[type] || colors.blue;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, background: c.bg, color: c.color }}>
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #1e2235", borderTop: "3px solid #f5a623", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "#8892b0" }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = "text", min, step }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "9px 12px", fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none" }}
      onFocus={e => (e.target.style.borderColor = "#f5a623")}
      onBlur={e => (e.target.style.borderColor = "#2e3450")}
    />
  );
}

export function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "9px 12px", fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none" }}
    >
      {children}
    </select>
  );
}

export function Table({ headers, children, empty }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ background: "#1a1d27", color: "#8892b0", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, padding: "11px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function TD({ children, style }) {
  return <td style={{ padding: "11px 16px", borderBottom: "1px solid #1a1d27", fontSize: 14, ...style }}>{children}</td>;
}

export function Rs(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`;
}
