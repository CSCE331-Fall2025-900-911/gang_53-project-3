"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

export default function EmployeeLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const clearTranslatePrefs = () => {
    if (typeof document === "undefined") return;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    localStorage.removeItem("googtrans");
    sessionStorage.removeItem("googtrans");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl =
        typeof window !== "undefined" && window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : process.env.NEXT_PUBLIC_API_URL || "https://gang53-project-3-backend.vercel.app";

      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/employees/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("employee", JSON.stringify(data.data));
        router.push("/manager-dashboard");
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-login-container">
      <button
        className="back-button"
        onClick={() => {
          clearTranslatePrefs();
          window.location.href = "/";
        }}
      >
        ← Back
      </button>

      <div className="employee-login-card">
        <h1 className="login-title">Bobalicious</h1>
        <p className="login-subtitle">Employee Portal</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
