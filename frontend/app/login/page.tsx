'use client';

import Link from 'next/link';
import { Suspense } from 'react';

const googleAuthUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://gang53-project-3-backend.vercel.app/auth/google'
    : 'http://localhost:5000/auth/google';

function LoginContent() {
  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-center shadow-lg">
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Bobalicious</h1>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Choose how you want to start your order.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-teal-800/60 bg-teal-900/20 p-6 shadow-lg shadow-teal-900/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-teal-200/80">Quick Access</p>
              <h2 className="text-xl font-bold">Log in with Google</h2>
            </div>
            <span className="rounded-full bg-teal-700/50 px-3 py-1 text-xs font-semibold text-white">
              Recommended
            </span>
          </div>
          <p className="text-sm text-zinc-200/80">
            Sync orders and rewards across visits. We’ll keep you signed in for a smooth checkout.
          </p>
          <a
            href={googleAuthUrl}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white text-black px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30"
          >
            Log in with Google
          </a>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-zinc-400">No account needed</p>
              <h2 className="text-xl font-bold">Continue as Guest</h2>
            </div>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200">
              Fast
            </span>
          </div>
          <p className="text-sm text-zinc-300/80">
            Jump straight into the menu. You can always log in later if you change your mind.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            Continue as Guest
          </Link>
        </div>
      </section>

    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
