import { createContext, useContext, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("rc_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem("rc_token", token);
    localStorage.setItem("rc_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("rc_token");
    localStorage.removeItem("rc_user");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
