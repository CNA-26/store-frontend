import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CART_API_BASE_URL = "https://cart-services-git-cartservices.2.rahtiapp.fi";

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
  isLoading: boolean;
  error: string | null;
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
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(readStoredCart);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  const [notificationId, setNotificationId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get auth token
  const getAuthToken = (): string | null => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  };

  // Helper function to create auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch cart from API
  const fetchCart = async () => {
    const token = getAuthToken();
    if (!user?.id || !token) {
      // No user or token, use local storage
      setCart(readStoredCart());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CART_API_BASE_URL}/cart/${user.id}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        // Unauthorized - token invalid or expired, fall back to local storage
        console.warn("Cart API authentication failed, using local storage");
        setCart(readStoredCart());
        setError(null); // Don't show error for auth issues
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to CartItem format
      const cartItems: CartItem[] = (data.items || []).map((item: any) => ({
        id: String(item.product_id || item.id),
        name: item.name || item.product_name || "",
        price: Number(item.price) || 0,
        qty: Number(item.quantity || item.qty) || 1,
      }));

      setCart(cartItems);
      setError(null);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch cart");
      // Fallback to local storage on error
      setCart(readStoredCart());
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with API when user changes
  useEffect(() => {
    if (user?.id) {
      fetchCart();
    } else {
      // User logged out, clear cart or use local storage
      setCart(readStoredCart());
    }
  }, [user?.id]);

  // Save to local storage for offline support
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage write errors
    }
  }, [cart]);

  const addToCart = async (item: AddItem) => {
    // Optimistic update
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
        return { ...prev, count: prev.count + 1 };
      }
      return { id: notificationId + 1, productName: item.name, count: 1 };
    });

    // Sync with API if user is logged in
    const token = getAuthToken();
    if (user?.id && token) {
      try {
        const response = await fetch(`${CART_API_BASE_URL}/cart/${user.id}/add-item`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          }),
        });

        if (response.status === 401) {
          // Unauthorized - just use local cart
          console.warn("Cart API authentication failed, using local cart only");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to add item: ${response.statusText}`);
        }

        // Refresh cart from server to ensure sync
        await fetchCart();
      } catch (err) {
        console.error("Error adding item to cart:", err);
        // Keep optimistic update even if API fails
      }
    }
  };

  const removeFromCart = async (id: string) => {
    // Optimistic update
    setCart((prev) => prev.filter((p) => p.id !== id));
    setHasInteracted(true);

    // Sync with API if user is logged in
    const token = getAuthToken();
    if (user?.id && token) {
      try {
        const response = await fetch(`${CART_API_BASE_URL}/cart/${user.id}/item/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.status === 401) {
          // Unauthorized - just use local cart
          console.warn("Cart API authentication failed, using local cart only");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to remove item: ${response.statusText}`);
        }

        // Refresh cart from server to ensure sync
        await fetchCart();
      } catch (err) {
        console.error("Error removing item from cart:", err);
        // Keep optimistic update even if API fails
      }
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      hasInteracted, 
      cartCount, 
      notification, 
      clearNotification,
      isLoading,
      error
    }}>
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
