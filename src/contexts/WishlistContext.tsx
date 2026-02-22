import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WISHLIST_API = "https://wishlist-service-git-wishlist-service.2.rahtiapp.fi";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type WishlistContextShape = {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
  moveToCart: (productCode: string, quantity?: number) => Promise<{ productCode: string; quantity: number } | null>;
  loading: boolean;
  loginToast: boolean;
  clearLoginToast: () => void;
};

const WishlistContext = createContext<WishlistContextShape | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginToast, setLoginToast] = useState(false);
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const logWishlistRequest = (label: string, details: Record<string, unknown>) => {
    console.debug(`[wishlist] ${label}`, details);
  };
  const getTokenMeta = () => {
    if (!token) return { hasToken: false };
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { hasToken: true, isJwtLike: false, parts: parts.length, length: token.length };
    }
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      const expMs = typeof payload.exp === "number" ? payload.exp * 1000 : null;
      return {
        hasToken: true,
        isJwtLike: true,
        length: token.length,
        iss: payload.iss ?? null,
        aud: payload.aud ?? null,
        sub: payload.sub ?? null,
        exp: payload.exp ?? null,
        expiresAt: expMs ? new Date(expMs).toISOString() : null,
        isExpired: expMs ? Date.now() > expMs : null,
      };
    } catch {
      return { hasToken: true, isJwtLike: true, decodeError: true, length: token.length };
    }
  };
  const isTokenExpired = () => {
    const meta = getTokenMeta() as { isExpired?: boolean | null };
    return meta.isExpired === true;
  };
  const readErrorBody = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const userId: string | null = user?.id || user?.userId || user?._id || user?.email || null;

  // Fetch wishlist from API whenever the logged-in user changes
  useEffect(() => {
    if (!userId || !token) {
      setWishlist([]);
      logWishlistRequest("skip fetch", { reason: "missing-user-or-token", hasUserId: Boolean(userId), hasToken: Boolean(token) });
      return;
    }
    if (isTokenExpired()) {
      logWishlistRequest("skip fetch", { reason: "token-expired" });
      logout();
      setLoginToast(true);
      setWishlist([]);
      return;
    }
    setLoading(true);
    logWishlistRequest("request", { action: "fetchWishlist", method: "GET", url: `${WISHLIST_API}/wishlist`, tokenMeta: getTokenMeta() });
    fetch(`${WISHLIST_API}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        logWishlistRequest("response", {
          action: "fetchWishlist",
          status: r.status,
          ok: r.ok,
          wwwAuthenticate: r.headers.get("www-authenticate"),
        });
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data?.products) {
          const items: WishlistItem[] = data.products.map((p: { productCode: string; name: string; pris: number; image?: string }) => ({
            id: p.productCode,
            name: p.name,
            price: p.pris, // API uses 'pris' (Swedish for price)
            image: p.image,
          }));
          setWishlist(items);
        }
      })
      .catch((error) => {
        logWishlistRequest("error", { action: "fetchWishlist", message: error instanceof Error ? error.message : "unknown" });
      })
      .finally(() => setLoading(false));
  }, [userId, token]);

  const addToWishlist = (item: WishlistItem) => {
    // Block wishlisting for unauthenticated users and prompt them to log in
    if (!userId || !token) {
      setLoginToast(true);
      logWishlistRequest("skip add", { reason: "missing-user-or-token", hasUserId: Boolean(userId), hasToken: Boolean(token), productCode: item.id });
      return;
    }
    if (isTokenExpired()) {
      logWishlistRequest("skip add", { reason: "token-expired", productCode: item.id });
      logout();
      setLoginToast(true);
      return;
    }
    // Optimistic update – skip if already in list
    setWishlist((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
    // Sync to API (userId is guaranteed non-null here due to early return above)
    logWishlistRequest("request", { action: "addToWishlist", method: "POST", url: `${WISHLIST_API}/wishlist`, tokenMeta: getTokenMeta(), productCode: item.id });
    fetch(`${WISHLIST_API}/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productCode: item.id }),
    })
      .then(async (r) => {
        logWishlistRequest("response", { action: "addToWishlist", status: r.status, ok: r.ok, productCode: item.id });
        if (!r.ok) {
          const errorBody = await readErrorBody(r);
          console.error("[wishlist] addToWishlist failed", {
            status: r.status,
            statusText: r.statusText,
            wwwAuthenticate: r.headers.get("www-authenticate"),
            productCode: item.id,
            errorBody,
            errorBodyText: typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody),
            tokenMeta: getTokenMeta(),
          });
          if (r.status === 401 && typeof errorBody === "object" && errorBody !== null && "detail" in errorBody) {
            const detail = String((errorBody as { detail?: unknown }).detail ?? "").toLowerCase();
            if (detail.includes("expired")) {
              logout();
              setLoginToast(true);
            }
          }
        }
      })
      .catch((error) => {
        logWishlistRequest("error", { action: "addToWishlist", message: error instanceof Error ? error.message : "unknown", productCode: item.id });
      });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== id));

    if (!userId || !token) {
      logWishlistRequest("skip remove", { reason: "missing-user-or-token", hasUserId: Boolean(userId), hasToken: Boolean(token), productCode: id });
      return;
    }

    if (isTokenExpired()) {
      logWishlistRequest("skip remove", { reason: "token-expired", productCode: id });
      logout();
      setLoginToast(true);
      return;
    }

    const encodedProductCode = encodeURIComponent(id);
    logWishlistRequest("request", {
      action: "removeFromWishlist",
      method: "DELETE",
      url: `${WISHLIST_API}/wishlist/${encodedProductCode}`,
      tokenMeta: getTokenMeta(),
      productCode: id,
    });

    fetch(`${WISHLIST_API}/wishlist/${encodedProductCode}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        logWishlistRequest("response", { action: "removeFromWishlist", status: r.status, ok: r.ok, productCode: id });
        if (!r.ok) {
          const errorBody = await readErrorBody(r);
          console.error("[wishlist] removeFromWishlist failed", {
            status: r.status,
            statusText: r.statusText,
            wwwAuthenticate: r.headers.get("www-authenticate"),
            productCode: id,
            errorBody,
            errorBodyText: typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody),
            tokenMeta: getTokenMeta(),
          });
          if (r.status === 401 && typeof errorBody === "object" && errorBody !== null && "detail" in errorBody) {
            const detail = String((errorBody as { detail?: unknown }).detail ?? "").toLowerCase();
            if (detail.includes("expired")) {
              logout();
              setLoginToast(true);
            }
          }
        }
      })
      .catch((error) => {
        logWishlistRequest("error", { action: "removeFromWishlist", message: error instanceof Error ? error.message : "unknown", productCode: id });
      });
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((item) => item.id === id);
  };

  const moveToCart = async (productCode: string, quantity = 1) => {
    if (!userId || !token) {
      logWishlistRequest("skip move", { reason: "missing-user-or-token", hasUserId: Boolean(userId), hasToken: Boolean(token), productCode, quantity });
      return null;
    }
    if (isTokenExpired()) {
      logWishlistRequest("skip move", { reason: "token-expired", productCode, quantity });
      logout();
      setLoginToast(true);
      return null;
    }
    try {
      logWishlistRequest("request", { action: "moveToCart", method: "POST", url: `${WISHLIST_API}/wishlist/move-to-cart`, tokenMeta: getTokenMeta(), productCode, quantity });
      const res = await fetch(`${WISHLIST_API}/wishlist/move-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, productCode, quantity }),
      });
      logWishlistRequest("response", { action: "moveToCart", status: res.status, ok: res.ok, productCode, quantity });
      if (!res.ok) {
        const errorBody = await readErrorBody(res);
        console.error("[wishlist] moveToCart failed", {
          status: res.status,
          statusText: res.statusText,
          wwwAuthenticate: res.headers.get("www-authenticate"),
          productCode,
          quantity,
          errorBody,
          errorBodyText: typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody),
          tokenMeta: getTokenMeta(),
        });
        if (res.status === 401 && typeof errorBody === "object" && errorBody !== null && "detail" in errorBody) {
          const detail = String((errorBody as { detail?: unknown }).detail ?? "").toLowerCase();
          if (detail.includes("expired")) {
            logout();
            setLoginToast(true);
          }
        }
        return null;
      }
      const data = await res.json();
      // Reflect the server-side wishlist state after the move
      if (Array.isArray(data.wishlistNow)) {
        // wishlistNow may be product code strings or objects with a productCode field
        const remaining = new Set<string>(
          (data.wishlistNow as Array<string | { productCode: string }>).map((item) =>
            typeof item === "string" ? item : item.productCode
          )
        );
        setWishlist((prev) => prev.filter((item) => remaining.has(item.id)));
      }
      return data.moved ?? null;
    } catch (error) {
      logWishlistRequest("error", { action: "moveToCart", message: error instanceof Error ? error.message : "unknown", productCode, quantity });
      return null;
    }
  };

  const clearLoginToast = () => setLoginToast(false);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount, moveToCart, loading, loginToast, clearLoginToast }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}

export default WishlistContext;
