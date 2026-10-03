"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import collection from "../collection.config.js";
import { createClient } from "../lib/supabase/client.js";

// Glassy look matches the search bar on the home page: translucent
// background + backdropFilter blur + soft border/shadow.
const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
  },
  brand: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
    textDecoration: "none",
  },
  right: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contribute: {
    padding: "8px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    textDecoration: "none",
    cursor: "pointer",
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
  profile: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: "50%",
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "block",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
};

// A randomly generated-looking avatar, stable per user (seeded from the
// email/id so it does not change on every reload). DiceBear is a free
// avatar API — this is just an <img> URL, no package or upload involved.
function avatarUrl(user) {
  const seed = encodeURIComponent(user.email || user.id);
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Same session check pattern as AuthStatus: ask Supabase who the
  // current session belongs to once on mount.
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
      // Sign out through Supabase and clear the auth cookies. The SDK
      // clears the local session even if the revoke request cannot reach
      // the server, so the UI can update immediately.
      await createClient().auth.signOut();
    } catch {
      // Ignored on purpose: the local session is cleared either way.
    }

    setUser(null);
    setIsSigningOut(false);
  }

  return (
    <nav style={styles.nav}>
      {/* Left side: the archive name. Swap this <Link> for an <img> or
          logo component later without touching the right side. */}
      <Link href="/" style={styles.brand} className="hover-button">
        {collection.name}
      </Link>

      <div style={styles.right}>
        <Link
          href="/contribute"
          style={styles.contribute}
          className="hover-button"
        >
          Contribute
        </Link>

        {isLoading ? null : user ? (
          // Signed in: Sign up is replaced by the profile avatar button (just the
          // generated avatar, no label) and Log in is replaced by Log out.
          <>
            <Link
              href="/profile"
              style={styles.profile}
              className="hover-button"
              aria-label="Profile"
              title="Profile"
            >
              <img src={avatarUrl(user)} alt="" style={styles.avatar} />
            </Link>
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
    </nav>
  );
}