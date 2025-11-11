'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendURL, setBackendURL] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') ?? 'en';

  useEffect(() => {
    const url = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_URL || 'https://gang53-project-3-backend.vercel.app');
    setBackendURL(url);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${backendURL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, lang }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
        {/* Title / hero */}
        <header className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center md:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Bobalicious — Customer Login
          </h1>
        </header>

        {/* Prompt box */}
        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 text-center md:p-10">
          <p className="text-lg font-semibold md:text-xl">
            Do you want to log in?
          </p>
          {/* Spanish line can be added later */}
          {/* <p className="mt-1 text-zinc-400">¿Quieres iniciar sesión?</p> */}
        </section>

        {/* Form card */}
        <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username row */}
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-5">
              <label
                htmlFor="username"
                className="md:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 md:text-base"
              >
                Username:
              </label>
              <div className="md:col-span-4">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-0 focus:border-zinc-600"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-5">
              <label
                htmlFor="password"
                className="md:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 md:text-base"
              >
                Password:
              </label>
              <div className="md:col-span-4">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-0 focus:border-zinc-600"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            {/* Login button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-48 rounded-xl border border-teal-700 bg-teal-800/70 px-6 py-3 text-center text-sm font-semibold tracking-wide transition-all hover:-translate-y-0.5 hover:bg-teal-700/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/30 disabled:opacity-60 md:w-56 md:text-base"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>
            </div>
          </form>

          {/* Optional OAuth link: keep, or remove if not needed now */}
          <div className="mt-6 text-center">
            <a
              href={
                process.env.NODE_ENV === 'production'
                  ? 'https://gang53-project-3-backend.vercel.app/auth/google'
                  : 'http://localhost:5000/auth/google'
              }
              className="inline-block rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-2 text-sm text-zinc-200 transition-all hover:bg-zinc-900"
            >
              Continue with Google
            </a>
          </div>
        </section>

        {/* Skip login block */}
        <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="mb-4 text-lg font-semibold">Skip login?</p>
          <Link
            href="/menu"
            className="inline-block w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 px-6 py-4 text-center font-semibold transition-all hover:bg-zinc-900"
          >
            Continue as Guest
          </Link>
        </section>
      </div>
    </main>
  );
}