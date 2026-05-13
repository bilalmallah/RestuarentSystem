import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return setError("Enter username and password");
    setLoading(true);
    setError("");
    try {
      const data = await api.login({ username, password });
      login(data.user, data.token);
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
      <div style={{ background: "#13151f", border: "1px solid #1e2235", borderRadius: 16, padding: "48px 40px", width: 380, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🍽</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f5a623", marginBottom: 4 }}>RestaurantOS</div>
        <div style={{ color: "#8892b0", fontSize: 13, marginBottom: 32 }}>Commission & Business Management</div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14, textAlign: "left" }}>
          <label style={{ fontSize: 11, color: "#8892b0", display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="owner / manager"
            style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "11px 14px", fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none" }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div style={{ marginBottom: 24, textAlign: "left" }}>
          <label style={{ fontSize: 11, color: "#8892b0", display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ background: "#1e2235", border: "1px solid #2e3450", color: "#e8e8e8", borderRadius: 8, padding: "11px 14px", fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none" }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ background: "#f5a623", color: "#0f1117", border: "none", padding: "13px 20px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, width: "100%", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={{ color: "#4a5568", fontSize: 11, marginTop: 16 }}>Default: owner/1234 or manager/1234</div>
      </div>
    </div>
  );
}
