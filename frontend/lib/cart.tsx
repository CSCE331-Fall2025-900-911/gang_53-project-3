'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = {
  id: string;              // unique line id (itemId + selections hash)
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;      // convenience snapshot; we’ll recompute too
  selections?: Record<string, string[]>; // groupId -> optionIds[]
  imageUrl?: string;
};

type CartState = {
  lines: CartLine[];
};

type CartAPI = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartAPI | null>(null);
const LS_KEY = 'bobalicious_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ lines: [] });

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const api = useMemo<CartAPI>(() => {
    const add = (line: CartLine) => {
      setState((s) => {
        const existing = s.lines.find((l) => l.id === line.id);
        if (existing) {
          const merged = s.lines.map((l) =>
            l.id === line.id
              ? {
                  ...l,
                  quantity: l.quantity + line.quantity,
                  totalPrice: (l.quantity + line.quantity) * l.unitPrice,
                }
              : l
          );
          return { lines: merged };
        }
        return { lines: [...s.lines, line] };
      });
    };

    const remove = (lineId: string) =>
      setState((s) => ({ lines: s.lines.filter((l) => l.id !== lineId) }));

    const setQty = (lineId: string, qty: number) =>
      setState((s) => ({
        lines: s.lines.map((l) =>
          l.id === lineId
            ? {
                ...l,
                quantity: Math.max(1, qty),
                totalPrice: Math.max(1, qty) * l.unitPrice,
              }
            : l
        ),
      }));

    const clear = () => setState({ lines: [] });

    const subtotal = state.lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);

    return { lines: state.lines, add, remove, setQty, clear, subtotal };
  }, [state.lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
