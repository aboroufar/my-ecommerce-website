"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { CartItem } from "@/lib/cart-types";

const STORAGE_KEY = "storefront:cart";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "SET_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items };
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId
      );
      if (existing) {
        // stockQty comes from the fresher add-to-cart click, so trust it
        // over whatever was cached in the existing cart line.
        const cap = action.item.stockQty;
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + action.item.quantity, cap),
                  stockQty: cap,
                }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            ...action.item,
            quantity: Math.min(action.item.quantity, action.item.stockQty),
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.productId !== action.productId),
      };
    case "SET_QUANTITY":
      return {
        items: state.items
          .map((i) =>
            i.productId === action.productId
              ? { ...i, quantity: Math.min(action.quantity, i.stockQty) }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage on mount (client-only, so no SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = (JSON.parse(raw) as CartItem[]).map((item) => ({
          // Carts saved before stockQty existed won't have it -- treat
          // missing/invalid as "unknown, don't block" rather than NaN-ing
          // every Math.min() call downstream.
          ...item,
          stockQty:
            typeof item.stockQty === "number" && Number.isFinite(item.stockQty)
              ? item.stockQty
              : Infinity,
        }));
        dispatch({ type: "HYDRATE", items });
      }
    } catch {
      // corrupt/unavailable storage -- start with an empty cart
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // storage unavailable (e.g. private browsing quota) -- cart just
      // won't persist across reloads, not worth surfacing an error for
    }
  }, [state.items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = state.items.reduce(
      (sum, i) => sum + i.priceCents * i.quantity,
      0
    );
    return {
      items: state.items,
      itemCount,
      subtotalCents,
      addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
      removeItem: (productId) => dispatch({ type: "REMOVE_ITEM", productId }),
      setQuantity: (productId, quantity) =>
        dispatch({ type: "SET_QUANTITY", productId, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
