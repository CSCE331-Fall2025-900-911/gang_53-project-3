"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";

const googleAuthUrl =
  process.env.NODE_ENV === "production"
    ? "https://gang53-project-3-backend.vercel.app/auth/google"
    : "http://localhost:5000/auth/google";

function LoginContent() {
  const [backendUrl, setBackendUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [signupMode, setSignupMode] = useState<boolean>(false);
  const [signupName, setSignupName] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const [signupUsername, setSignupUsername] = useState<string>("");
  const [signupPassword, setSignupPassword] = useState<string>("");
  const [signupError, setSignupError] = useState<string>("");
  const [signupLoading, setSignupLoading] = useState<boolean>(false);

  useEffect(() => {
    const url =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : (process.env.NEXT_PUBLIC_API_URL || "https://gang53-project-3-backend.vercel.app");
    setBackendUrl(url.replace(/\/$/, ""));
  }, []);

  const clearTranslatePrefs = () => {
    if (typeof document === "undefined") return;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    localStorage.removeItem("googtrans");
    sessionStorage.removeItem("googtrans");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword,
          name: signupName,
          email: signupEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignupError(data.error || "Sign up failed");
        setSignupLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setSignupError("Connection error. Please try again.");
      setSignupLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => {
            clearTranslatePrefs();
            window.location.href = "/";
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800"
        >
          ← Back
        </button>
      </div>

      <header className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-center shadow-lg">
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Bobalicious
        </h1>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Choose how you want to start your order.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Google Login */}
        <div className="rounded-3xl border border-teal-800/60 bg-teal-900/20 p-6 shadow-lg shadow-teal-900/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-teal-200/80">
                Quick Access
              </p>
              <h2 className="text-xl font-bold">Log in with Google</h2>
            </div>
            <span className="rounded-full bg-teal-700/50 px-3 py-1 text-xs font-semibold text-white">
              Recommended
            </span>
          </div>
          <p className="text-sm text-zinc-200/80">
            Sync orders and rewards across visits. We will keep you signed in for a smooth checkout.
          </p>

          <a
            href={googleAuthUrl}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white text-black px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30"
          >
            Log in with Google
          </a>
        </div>

        {/* Manual Login / Signup */}
        <div className="rounded-3xl border border-purple-800/60 bg-purple-900/20 p-6 shadow-lg shadow-purple-900/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-purple-200/80">
                Account Login
              </p>
              <h2 className="text-xl font-bold">
                {signupMode ? "Create your account" : "Sign in with Username"}
              </h2>
            </div>
            <span className="rounded-full bg-purple-700/50 px-3 py-1 text-xs font-semibold text-white">
              {signupMode ? "New" : "Secure"}
            </span>
          </div>

          {!signupMode && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !backendUrl}
                className="w-full rounded-2xl border border-purple-700 bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignupMode(true);
                  setError("");
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800"
              >
                Sign Up
              </button>
            </form>
          )}

          {signupMode && (
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={signupName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignupName(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignupEmail(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <input
                type="text"
                placeholder="Username"
                value={signupUsername}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignupUsername(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <input
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignupPassword(e.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />

              {signupError && <p className="text-sm text-red-400">{signupError}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSignupMode(false);
                    setSignupError("");
                  }}
                  className="w-1/3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupLoading || !backendUrl}
                  className="w-2/3 rounded-2xl border border-purple-700 bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signupLoading ? "Signing up..." : "Create account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Guest Mode */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-zinc-400">
              No account needed
            </p>
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
