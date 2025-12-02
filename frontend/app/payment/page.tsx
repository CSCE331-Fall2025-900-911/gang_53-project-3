"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

const SUBMISSION_FLAG = "boba-order-submitted";

export default function PaymentPage() {
  const { items, subtotal, clear } = useCart();
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_URL || "");
  const [orderStatus, setOrderStatus] = useState<
    "processing" | "success" | "error"
  >("processing");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const submissionGuard = useRef(false);

  // Set API base first
  useEffect(() => {
    if (typeof window === "undefined") return;
    const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const isLocal = window.location.hostname === "localhost";
    const base = isLocal
      ? window.location.origin
      : envUrl
      ? envUrl.replace(/\/$/, "")
      : window.location.origin;
    setApiBase(base);
  }, []);

  const orderNumber = useMemo(
    () => `BOBA-${Math.floor(100000 + Math.random() * 900000)}`,
    []
  );

  const readyTime = useMemo(() => {
    const eta = new Date(Date.now() + 12 * 60 * 1000);
    return eta.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatSelections = (selections: Record<string, string[]>) => {
    const labels = Object.values(selections ?? {}).flat();
    return labels.length ? labels.join(", ") : "No customizations";
  };

  const clearSubmissionFlag = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SUBMISSION_FLAG);
  };

  const resetLanguagePreference = () => {
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    localStorage.removeItem("googtrans");
    sessionStorage.removeItem("googtrans");
  };

  const submitOrder = useCallback(async () => {
    // Check if already submitted
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem(SUBMISSION_FLAG) === "1"
    ) {
      setOrderStatus("success");
      return;
    }

    if (!items.length) {
      setOrderStatus("success");
      return;
    }

    if (submissionGuard.current) return;

    // Don't submit if apiBase isn't ready
    if (!apiBase) {
      console.warn("API base not ready yet");
      return;
    }

    submissionGuard.current = true;
    setOrderStatus("processing");
    setOrderError(null);

    try {
      const payload = {
        customerName: "Guest",
        items: items.map((i) => ({
          itemId: i.itemId, // must be string
          quantity: i.quantity, // number
          name: i.name, // string
          selections: {
            // MUST be object-of-arrays, never empty object unless needed
            ...i.selections,
          },
        })),
      };

      const endpoint = `${apiBase}/api/orders`;
      console.log("Submitting order to:", endpoint); // Debug log

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(res);

      if (!res.ok) {
        const text = await res.text();
        console.error("Order submission failed:", text); // Debug log
        throw new Error(text || `Order service returned ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      if (data?.orderId) setOrderId(String(data.orderId));

      sessionStorage.setItem(SUBMISSION_FLAG, "1");
      setOrderStatus("success");
    } catch (err) {
      submissionGuard.current = false;
      const message =
        err instanceof Error ? err.message : "Failed to submit order";
      console.error("Order error:", message); // Debug log
      setOrderError(message);
      setOrderStatus("error");
    }
  }, [apiBase, items]); // Added apiBase to dependencies

  // Submit order when apiBase is ready
  useEffect(() => {
    if (!apiBase) return; // Wait for apiBase to be set
    submitOrder();
  }, [apiBase, submitOrder]); // Trigger when apiBase or submitOrder changes

  const handleRetry = () => {
    submissionGuard.current = false; // Reset guard
    clearSubmissionFlag();
    submitOrder();
  };

  const handleEndOrder = async () => {
    clear();
    clearSubmissionFlag();
    resetLanguagePreference();

    try {
      if (apiBase) {
        await fetch(`${apiBase}/auth/logout`, { credentials: "include" });
      }
    } catch (err) {
      console.error("Logout failed, continuing to landing page", err);
    } finally {
      window.location.href = "/";
    }
  };

  const statusLabel =
    orderStatus === "processing"
      ? "Processing Order"
      : orderStatus === "error"
      ? "Order Failed"
      : "Payment Successful";

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <header className="mb-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/70 bg-emerald-900/40 px-4 py-1 text-sm font-semibold text-emerald-100">
            {statusLabel}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {orderStatus === "error"
              ? "One more step"
              : "Thanks for your order!"}
          </h1>
          <p className="text-sm text-zinc-400">
            Order #{orderId ?? orderNumber} • Estimated ready by {readyTime}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <span className="text-sm text-zinc-400">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-zinc-400">Looks like your cart is empty.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-zinc-400">
                        {formatSelections(item.selections)}
                      </p>
                      <p className="text-sm text-zinc-300 mt-1">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-semibold">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total paid</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {orderStatus === "processing" && (
              <p className="text-sm text-zinc-400">Submitting your order...</p>
            )}
            {orderStatus === "success" && (
              <p className="text-sm text-zinc-400">
                You'll receive a confirmation email shortly. If you need to make
                changes, head back to your cart.
              </p>
            )}
            {orderStatus === "error" && (
              <p className="text-sm text-red-300">
                We could not finalize your order.{" "}
                {orderError || "Please try again."}
              </p>
            )}

            <div className="space-y-3">
              <Link
                href="/dashboard"
                onClick={() => {
                  clearSubmissionFlag();
                  clear();
                }}
                className="block w-full rounded-xl border border-teal-700 bg-teal-800/70 px-4 py-3 text-center font-semibold hover:bg-teal-700/70"
              >
                Start a New Order
              </Link>
              {orderStatus === "error" && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="block w-full rounded-xl border border-orange-700 bg-orange-900/40 px-4 py-3 text-center font-semibold text-orange-50 hover:bg-orange-800/60"
                >
                  Retry Submission
                </button>
              )}
              <button
                type="button"
                onClick={handleEndOrder}
                className="block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center font-semibold hover:bg-zinc-800"
              >
                End Order
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
