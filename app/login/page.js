"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client.js";

const styles = {
  wrap: {
    maxWidth: 460,
    margin: "0 auto",
    padding: "80px 20px",
  },
  kicker: {
    fontFamily: "'Courier New', monospace",
    color: "#ffffff",
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    margin: "16px 0 28px",
    lineHeight: 1.2,
  },
  card: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
  },
  label: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#ffffff",
    display: "block",
    margin: "0 0 6px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
  },
  button: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
  },
  error: {
    margin: "0 0 12px",
    padding: "10px 12px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#ff9a9a",
    fontSize: 14,
  },
  alt: {
    marginTop: 20,
    fontSize: 14,
    color: "#cbd7ec",
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
  },
  back: {
    display: "inline-block",
    marginTop: 24,
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 15,
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    // The password only exists in this call — Supabase Auth verifies it
    // and this app never stores it.
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Always the same generic message. Never say things like "no
        // account found with that email" or "email not confirmed", or the
        // form becomes a way to find out which emails are registered.
        setError("Invalid email or password.");
      } else {
        // Signed in. @supabase/ssr wrote the session into browser cookies,
        // so the middleware keeps it fresh on the server. Navigate home.
        window.location.href = "/";
      }
    } catch {
      setError("Invalid email or password.");
    }

    setIsLoading(false);
  }

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>Sign in</h1>

      <form style={styles.card} onSubmit={handleSubmit}>
        <label style={styles.label} htmlFor="login-email">
          EMAIL
        </label>
        <input
          id="login-email"
          style={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          required
        />

        <label style={styles.label} htmlFor="login-password">
          PASSWORD
        </label>
        <input
          id="login-password"
          style={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />

        {error && (
          <p style={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={styles.alt}>
        No account yet?{" "}
        <Link href="/signup" style={styles.link}>
          Create one
        </Link>
      </p>

      <Link href="/" style={styles.back}>
        ← Back to the archive
      </Link>
    </main>
  );
}