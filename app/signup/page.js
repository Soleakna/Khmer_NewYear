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
  message: {
    margin: "0 0 12px",
    padding: "10px 12px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#8fd694",
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
    marginTop: 32,
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 600,
  },
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoading) return;

    setError(null);
    setMessage(null);

    // Instant local check matching Supabase's default minimum length (6).
    // The real rule is enforced by Supabase Auth on the server.
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    // Supabase Auth creates and stores the account and handles the
    // password. This app just forwards the typed credentials and never
    // stores a password itself.
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Show Supabase's own message so the user knows what to fix, e.g.
        // "A user with this email address is already registered.",
        // "Password should be at least 6 characters.", "Signups not
        // allowed for this instance".
        setError(error.message || "Sign up failed. Please try again.");
      } else if (data.session) {
        // This project has auto-confirm enabled, so the new account is
        // already signed in — behave like a successful sign-in.
        window.location.href = "/";
      } else {
        // Email confirmation is required: Supabase sent a link and no
        // session exists yet.
        setMessage(
          "Check your email for a confirmation link, then sign in."
        );
        setPassword("");
      }
    } catch {
      setError("Sign up is unavailable right now. Please try again.");
    }

    setIsLoading(false);
  }

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>Create an account</h1>

      <form style={styles.card} onSubmit={handleSubmit}>
        <label style={styles.label} htmlFor="signup-email">
          EMAIL
        </label>
        <input
          id="signup-email"
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

        <label style={styles.label} htmlFor="signup-password">
          PASSWORD
        </label>
        <input
          id="signup-password"
          style={styles.input}
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
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

        {message && (
          <p style={styles.message} role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="hover-button"
          disabled={isLoading}
          style={{
            ...styles.button,
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p style={styles.alt}>
        Already have an account?{" "}
        <Link href="/login" style={styles.link}>
          Sign in
        </Link>
      </p>

      <Link href="/" style={styles.back} className="hover-button">
        ← Back to home
      </Link>
    </main>
  );
}