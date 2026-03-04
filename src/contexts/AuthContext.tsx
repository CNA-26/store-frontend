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

function extractRolesFromPayload(payload: Record<string, any>): string[] {
  const roles: string[] = [];

  const addRole = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) roles.push(trimmed);
    }
  };

  const addRoles = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(addRole);
      return;
    }
    addRole(value);
  };

  addRoles(payload.role);
  addRoles(payload.roles);
  addRoles(payload.realm_access?.roles);

  const resourceAccess = payload.resource_access;
  if (resourceAccess && typeof resourceAccess === "object") {
    Object.values(resourceAccess).forEach((resource: any) => addRoles(resource?.roles));
  }

  return [...new Set(roles)];
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
  const roles = extractRolesFromPayload(payload);
  const role = roles[0] || null;

  const fallbackName = email ? String(email).split("@")[0] : "User";

  return {
    id: payload.sub || payload.user_id || payload.uid || email || "user",
    email,
    name: name || fallbackName,
    role,
    roles,
  };
}

function hydrateUserFromStorageOrToken(): User | null {
  let storedUser: User | null = null;

  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      storedUser = JSON.parse(stored);
    }
  } catch {}

  try {
    const tokenFromUrl = getTokenFromUrl();
    const tokenFromStorage = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const token = tokenFromUrl || tokenFromStorage;

    if (!token) return storedUser;

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("accessToken", tokenFromUrl);
    }

    const userFromToken = buildUserFromToken(token);
    if (!userFromToken) return storedUser;

    const mergedUser = {
      ...(storedUser || {}),
      ...userFromToken,
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));
    if (mergedUser.email) localStorage.setItem("email", String(mergedUser.email));
    if (mergedUser.name) localStorage.setItem("name", String(mergedUser.name));
    return mergedUser;
  } catch {
    return storedUser;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => hydrateUserFromStorageOrToken());

  const login = (u: User, token?: string) => {
    try {
      let userToStore = u;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);

        const userFromToken = buildUserFromToken(token);
        if (userFromToken) {
          userToStore = {
            ...u,
            ...userFromToken,
          };
        }
      }

      localStorage.setItem("user", JSON.stringify(userToStore));
      if (userToStore?.email) localStorage.setItem("email", String(userToStore.email));
      if (userToStore?.name) localStorage.setItem("name", String(userToStore.name));

      setUser(userToStore);
      return;
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
