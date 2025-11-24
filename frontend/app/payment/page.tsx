'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';

export default function PaymentPage() {
  const { items, subtotal, clear } = useCart();
  const [backendURL, setBackendURL] = useState('');

  useEffect(() => {
    const url =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : (process.env.NEXT_PUBLIC_API_URL || 'https://gang53-project-3-backend.vercel.app');
    setBackendURL(url.replace(/\/$/, ''));
  }, []);

  const orderNumber = useMemo(
    () => `BOBA-${Math.floor(100000 + Math.random() * 900000)}`,
    []
  );

  const readyTime = useMemo(() => {
    const eta = new Date(Date.now() + 12 * 60 * 1000);
    return eta.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const resetLanguagePreference = () => {
    // Google Translate stores language choice in the googtrans cookie
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    localStorage.removeItem('googtrans');
    sessionStorage.removeItem('googtrans');
  };

  const handleEndOrder = async () => {
    clear();
    resetLanguagePreference();

    try {
      if (backendURL) {
        await fetch(`${backendURL}/auth/logout`, { credentials: 'include' });
      }
    } catch (err) {
      console.error('Logout failed, continuing to landing page', err);
    } finally {
      window.location.href = '/';
    }
  };

  const formatSelections = (selections: Record<string, string[]>) => {
    const labels = Object.values(selections ?? {}).flat();
    return labels.length ? labels.join(', ') : 'No customizations';
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <header className="mb-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/70 bg-emerald-900/40 px-4 py-1 text-sm font-semibold text-emerald-100">
            Payment Successful
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Thanks for your order!
          </h1>
          <p className="text-sm text-zinc-400">
            Order #{orderNumber} • Estimated ready by {readyTime}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <span className="text-sm text-zinc-400">
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-zinc-400">Looks like your cart is empty.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3">
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
            <p className="text-sm text-zinc-400">
              You'll receive a confirmation email shortly. If you need to make changes,
              head back to your cart.
            </p>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                onClick={clear}
                className="block w-full rounded-xl border border-teal-700 bg-teal-800/70 px-4 py-3 text-center font-semibold hover:bg-teal-700/70"
              >
                Start a New Order
              </Link>
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
