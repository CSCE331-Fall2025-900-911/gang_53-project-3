'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const { items, remove, subtotal } = useCart();

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-16">
        {/* Title */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Cart</h1>
        </header>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-300">Your cart is empty.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-xl border border-teal-700 bg-teal-800/70 px-5 py-2 font-semibold hover:bg-teal-700/70"
            >
              Back to Menu
            </Link>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <section className="space-y-4">
            {items.map((l) => (
              <article
                key={l.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  {/* thumbnail placeholder */}
                  <div className="h-16 w-16 rounded-xl bg-zinc-800/70" />
                  <div>
                    <h3 className="font-semibold">{l.name}</h3>
                    {l.selections && (
                      <p className="text-sm text-zinc-400">
                        {Object.entries(l.selections)
                          .flatMap(([_, opts]) => opts)
                          .join(', ') || 'No customizations'}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-zinc-300">
                      ${l.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity control */}
                  <div className="flex items-center rounded-xl border border-zinc-700">
                    <button
                      disabled
                      className="px-3 py-2 opacity-50 cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="px-3">{l.quantity}</span>
                    <button
                      disabled
                      className="px-3 py-2 opacity-50 cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="w-24 text-right font-semibold">
                    ${(l.unitPrice * l.quantity).toFixed(2)}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => remove(l.id)}
                    className="rounded-lg border border-red-800/60 bg-red-900/40 px-3 py-2 text-sm text-red-200 hover:bg-red-900/60"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Summary / Payment */}
        {items.length > 0 && (
          <section className="mt-8 flex flex-col items-center justify-end gap-4 md:flex-row">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-lg font-semibold">
              Total: ${subtotal.toFixed(2)}
            </div>
            <Link
              href="/payment"
              className="rounded-xl border border-indigo-700 bg-indigo-800/70 px-6 py-3 font-semibold hover:bg-indigo-700/70"
            >
              Go to Payment
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}