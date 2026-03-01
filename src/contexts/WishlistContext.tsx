import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WISHLIST_API = (import.meta.env.VITE_WISHLIST_API as string) || "https://wishlist-service-git-wishlist-service.2.rahtiapp.fi";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type WishlistContextShape = {
  wishlist: WishlistItem[];
  wishlistStats: Record<string, number>;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
  moveToCart: (productCode: string, quantity?: number) => Promise<{ productCode: string; quantity: number } | null>;
  loading: boolean;
  statsLoading: boolean;
  loginToast: boolean;
  clearLoginToast: () => void;
  refreshWishlistStats: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextShape | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistStats, setWishlistStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loginToast, setLoginToast] = useState(false);
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const PRODUCT_API = (import.meta.env.VITE_API_BASE as string) || "https://product-service-products-service.2.rahtiapp.fi";
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
  const parsePrice = (value: unknown) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const resolveProductImage = (candidate: unknown) => {
    if (!candidate) return undefined;
    const raw = String(candidate);
    if (!raw) return undefined;
    try {
      if (/^https?:\/\//.test(raw)) return raw;
      const baseOrigin = new URL(PRODUCT_API).origin;
      if (raw.startsWith("/")) return `${baseOrigin}${raw}`;
      return `${baseOrigin}/images/${raw}`;
    } catch {
      return undefined;
    }
  };

  const refreshWishlistStats = async () => {
    setStatsLoading(true);
    try {
      logWishlistRequest("request", { action: "fetchWishlistStats", method: "GET", url: `${WISHLIST_API}/wishlist/stats` });
      const res = await fetch(`${WISHLIST_API}/wishlist/stats`);
      logWishlistRequest("response", { action: "fetchWishlistStats", status: res.status, ok: res.ok });
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        setWishlistStats({});
        return;
      }
      const normalized = Object.entries(data as Record<string, unknown>).reduce<Record<string, number>>((acc, [code, count]) => {
        const parsed = typeof count === "number" ? count : Number(count);
        if (Number.isFinite(parsed) && parsed > 0) {
          acc[String(code)] = parsed;
        }
        return acc;
      }, {});
      setWishlistStats(normalized);
    } catch (error) {
      logWishlistRequest("error", { action: "fetchWishlistStats", message: error instanceof Error ? error.message : "unknown" });
    } finally {
      setStatsLoading(false);
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
      .then(async (data) => {
        if (data?.products) {
          const rawProducts: any[] = Array.isArray(data.products) ? data.products : [];
          const items: WishlistItem[] = rawProducts.map((p: any) => {
            const codeFromPrimitive = typeof p === "string" || typeof p === "number" ? String(p) : null;
            const code = String(
              codeFromPrimitive ?? p?.productCode ?? p?.product_code ?? p?.code ?? p?.id ?? ""
            );
            const price = parsePrice(p?.pris ?? p?.price ?? p?.product_price);
            const firstImage = Array.isArray(p?.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : undefined;
            return {
              id: code,
              name: p?.name ?? p?.product_name ?? p?.title ?? "",
              price: price ?? 0,
              image: resolveProductImage(firstImage ?? p?.image ?? p?.img),
            };
          });

          const needsEnrichment = items.some((it) => !it.name || !(Number.isFinite(it.price) && it.price > 0) || !it.image);
          if (needsEnrichment) {
            try {
              const productRes = await fetch(`${PRODUCT_API.replace(/\/$/, "")}/products`);
              if (productRes.ok) {
                const productData = await productRes.json();
                const catalog: any[] = Array.isArray(productData) ? productData : [];
                const findMatch = (code: string) =>
                  catalog.find((p) => String(p?.product_code ?? "") === code) ||
                  catalog.find((p) => String(p?.id ?? "") === code);

                for (const item of items) {
                  if (!item.id) continue;
                  const matched = findMatch(item.id);
                  if (!matched) continue;
                  if (!item.name) item.name = matched.product_name ?? matched.name ?? item.name;
                  if (!(Number.isFinite(item.price) && item.price > 0)) {
                    const matchedPrice = parsePrice(matched.price ?? matched.pris ?? matched.product_price);
                    if (matchedPrice !== null) item.price = matchedPrice;
                  }
                  if (!item.image) {
                    const matchedImage = Array.isArray(matched?.image_urls) && matched.image_urls.length > 0
                      ? matched.image_urls[0]
                      : matched.img ?? matched.image;
                    item.image = resolveProductImage(matchedImage);
                  }
                }
              }
            } catch {
              logWishlistRequest("error", { action: "enrichWishlistProducts", message: "failed to fetch product catalog" });
            }
          }

          for (const item of items) {
            if (!item.name) item.name = item.id || "Unknown product";
            if (!Number.isFinite(item.price)) item.price = 0;
          }
          setWishlist(items);
        }
      })
      .catch((error) => {
        logWishlistRequest("error", { action: "fetchWishlist", message: error instanceof Error ? error.message : "unknown" });
      })
      .finally(() => setLoading(false));
  }, [userId, token]);

  useEffect(() => {
    void refreshWishlistStats();
  }, []);

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
          return;
        }
        await refreshWishlistStats();
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
          return;
        }
        await refreshWishlistStats();
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
        body: JSON.stringify({ userId, productCode }),
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
      if (Array.isArray(data.remainingWishlist)) {
        const remaining = new Set<string>(
          (data.remainingWishlist as Array<string | { productCode?: string; product_code?: string }>).map((item) =>
            typeof item === "string" ? item : String(item.productCode ?? item.product_code ?? "")
          )
        );
        setWishlist((prev) => prev.filter((item) => remaining.has(item.id)));
      } else {
        setWishlist((prev) => prev.filter((item) => item.id !== productCode));
      }
      await refreshWishlistStats();
      return {
        productCode: String(data.productCode ?? productCode),
        quantity,
      };
    } catch (error) {
      logWishlistRequest("error", { action: "moveToCart", message: error instanceof Error ? error.message : "unknown", productCode, quantity });
      return null;
    }
  };

  const clearLoginToast = () => setLoginToast(false);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistStats,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
        moveToCart,
        loading,
        statsLoading,
        loginToast,
        clearLoginToast,
        refreshWishlistStats,
      }}
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
