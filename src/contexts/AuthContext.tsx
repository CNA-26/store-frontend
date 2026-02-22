import React, { createContext, useContext, useEffect, useState } from "react";

type User = any;

type AuthContextType = {
  user: User | null;
  login: (user: User, token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (u: User, token?: string) => {
    try {
      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(u));
    } catch {}
    setUser(u);
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return;
      setUser(JSON.parse(stored));
    } catch {}
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
