"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client.js";

const styles = {
  bar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    minHeight: 30,
    margin: "0 0 28px",
  },
  kicker: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#ffffff",
    letterSpacing: 1,
  },
  email: {
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    color: "#cbd7ec",
  },
  action: {
    padding: "8px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "inherit",
    textDecoration: "none",
    cursor: "pointer",
  },
};

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Ask Supabase who the current session belongs to. This is the trusted
  // source for the header: the call re-runs on every mount, so the state
  // stays correct after navigation and page refreshes (the middleware
  // refreshes the session cookie before the page renders).
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (!cancelled) setUser(error ? null : data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // Sign out through Supabase and clear the auth cookies in the
      // browser. The SDK removes the local session even when the revoke
      // request cannot reach the server, so the UI can update immediately
      // without a page reload.
      await createClient().auth.signOut();
    } catch {
      // Ignored on purpose: the local session is cleared either way.
    }

    setUser(null);
    setIsSigningOut(false);
  }

  return (
    <div style={styles.bar}>
      {isLoading ? null : user ? (
        <>
          <span style={styles.kicker}>SIGNED IN AS</span>
          <span style={styles.email}>{user.email}</span>
          <button
            type="button"
            className="hover-button"
            style={{
              ...styles.action,
              opacity: isSigningOut ? 0.5 : 1,
              cursor: isSigningOut ? "default" : "pointer",
            }}
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Logging out…" : "Log out"}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={styles.action} className="hover-button">
            Log in
          </Link>
          <Link href="/signup" style={styles.action} className="hover-button">
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}