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

const TOKEN_KEYS = ["accessToken", "token", "access_token", "id_token"];

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getTokenFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);

    for (const key of TOKEN_KEYS) {
      const value = url.searchParams.get(key);
      if (value) {
        url.searchParams.delete(key);
        const search = url.searchParams.toString();
        const nextUrl = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
        window.history.replaceState(null, "", nextUrl);
        return value;
      }
    }

    const rawHash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    if (!rawHash) return null;

    const hashParams = new URLSearchParams(rawHash);
    for (const key of TOKEN_KEYS) {
      const value = hashParams.get(key);
      if (value) {
        hashParams.delete(key);
        const hash = hashParams.toString();
        const search = url.searchParams.toString();
        const nextUrl = `${url.pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
        return value;
      }
    }
  } catch {}

  return null;
}

function buildUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email =
    payload.email ||
    payload.preferred_username ||
    payload.upn ||
    payload.unique_name ||
    payload.user_email ||
    null;
  const name = payload.name || payload.given_name || payload.fullName || payload.nickname || null;
  const role = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles) || null;

  const fallbackName = email ? String(email).split("@")[0] : "User";

  return {
    id: payload.sub || payload.user_id || payload.uid || email || "user",
    email,
    name: name || fallbackName,
    role,
  };
}

function hydrateUserFromStorageOrToken(): User | null {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  try {
    const tokenFromUrl = getTokenFromUrl();
    const tokenFromStorage = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const token = tokenFromUrl || tokenFromStorage;
    if (!token) return null;

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("accessToken", tokenFromUrl);
    }

    const userFromToken = buildUserFromToken(token);
    if (!userFromToken) return null;

    localStorage.setItem("user", JSON.stringify(userFromToken));
    if (userFromToken.email) localStorage.setItem("email", String(userFromToken.email));
    if (userFromToken.name) localStorage.setItem("name", String(userFromToken.name));
    return userFromToken;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => hydrateUserFromStorageOrToken());

  const login = (u: User, token?: string) => {
    try {
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("user", JSON.stringify(u));
    } catch {}
    setUser(u);
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    const refreshUser = () => {
      setUser(hydrateUserFromStorageOrToken());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "user" || event.key === "token" || event.key === "accessToken" || event.key === null) {
        refreshUser();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
      }
    };

    refreshUser();
    window.addEventListener("focus", refreshUser);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", refreshUser);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
