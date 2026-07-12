"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { cartLineKey, type CartItem } from "@/lib/cart-types";

const STORAGE_KEY = "storefront:cart";
// Matches the checkout API's z.number().int().positive().max(99) -- the
// only cap applied client-side; real stock is never checked until checkout.
const MAX_QUANTITY = 99;

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; lineKey: string }
  | { type: "SET_QUANTITY"; lineKey: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items };
    case "ADD_ITEM": {
      const key = cartLineKey(action.item);
      const existing = state.items.find((i) => cartLineKey(i) === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            cartLineKey(i) === key
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + action.item.quantity, MAX_QUANTITY),
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
            quantity: Math.min(action.item.quantity, MAX_QUANTITY),
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => cartLineKey(i) !== action.lineKey),
      };
    case "SET_QUANTITY":
      return {
        items: state.items
          .map((i) =>
            cartLineKey(i) === action.lineKey
              ? { ...i, quantity: Math.min(action.quantity, MAX_QUANTITY) }
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
  removeItem: (lineKey: string) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
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
        dispatch({ type: "HYDRATE", items: JSON.parse(raw) as CartItem[] });
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
      removeItem: (lineKey) => dispatch({ type: "REMOVE_ITEM", lineKey }),
      setQuantity: (lineKey, quantity) =>
        dispatch({ type: "SET_QUANTITY", lineKey, quantity }),
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
