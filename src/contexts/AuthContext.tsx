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

  // Try to fetch profile when we don't have a stored user.
  // This supports both token-in-localStorage and cookie-based sessions (credentials: 'include').
  useEffect(() => {
    const tryFetchProfile = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) return; // already have user

        const token = localStorage.getItem("token");
        const base = "https://user-service-cna-26-user-service.2.rahtiapp.fi";

        let res: Response | undefined;
        if (token) {
          res = await fetch(`${base}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
        } else {
          // attempt cookie-based session
          res = await fetch(`${base}/api/auth/me`, { credentials: "include" });
        }

        if (!res || !res.ok) return;
        const data = await res.json();
        const fetched = data.user || data;
        if (fetched) {
          setUser(fetched);
          try {
            localStorage.setItem("user", JSON.stringify(fetched));
          } catch {}
        }
      } catch {
        // ignore errors
      }
    };

    tryFetchProfile();
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
