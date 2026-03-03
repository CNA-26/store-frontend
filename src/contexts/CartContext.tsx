import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type AddItem = { id: string; name: string; price: number };

export type CartNotification = {
  id: number;
  productName: string;
  count: number;
};

type CartContextShape = {
  cart: CartItem[];
  addToCart: (item: AddItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  hasInteracted: boolean;
  cartCount: number;
  notification: CartNotification | null;
  clearNotification: () => void;
};

const CartContext = createContext<CartContextShape | undefined>(undefined);
const CART_STORAGE_KEY = "monstera_cart_v1";

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Partial<CartItem>;
        const id = typeof candidate.id === "string" ? candidate.id : "";
        const name = typeof candidate.name === "string" ? candidate.name : "";
        const price = Number(candidate.price);
        const qty = Number(candidate.qty);

        if (!id || !name || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) {
          return null;
        }

        return {
          id,
          name,
          price,
          qty,
        } as CartItem;
      })
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(readStoredCart);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  const [notificationId, setNotificationId] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage write errors
    }
  }, [cart]);

  const addToCart = (item: AddItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setHasInteracted(true);
    
    // Create notification
    setNotificationId((prev) => prev + 1);
    setNotification((prev) => {
      if (prev && prev.productName === item.name) {
        // Increment count if same product
        return { ...prev, count: prev.count + 1 };
      }
      // New notification
      return { id: notificationId + 1, productName: item.name, count: 1 };
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
    setHasInteracted(true);
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, hasInteracted, cartCount, notification, clearNotification }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export default CartContext;
