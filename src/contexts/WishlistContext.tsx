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
};

const WishlistContext = createContext<WishlistContextShape | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const userId: string | null = user?.id || user?.userId || user?._id || user?.email || null;

  // Fetch wishlist from API whenever the logged-in user changes
  useEffect(() => {
    if (!userId) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    fetch(`${WISHLIST_API}/wishlist/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const addToWishlist = (item: WishlistItem) => {
    // Optimistic update – skip if already in list
    setWishlist((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
    // Sync to API when user is logged in and item has a valid product code
    if (userId && item.id) {
      fetch(`${WISHLIST_API}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productCode: item.id }),
      }).catch(() => {});
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((item) => item.id === id);
  };

  const moveToCart = async (productCode: string, quantity = 1) => {
    if (!userId) return null;
    try {
      const res = await fetch(`${WISHLIST_API}/wishlist/${userId}/move-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode, quantity }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Reflect the server-side wishlist state after the move
      if (Array.isArray(data.wishlistNow)) {
        const remaining = new Set<string>(data.wishlistNow as string[]);
        setWishlist((prev) => prev.filter((item) => remaining.has(item.id)));
      }
      return data.moved ?? null;
    } catch {
      return null;
    }
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount, moveToCart, loading }}
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
