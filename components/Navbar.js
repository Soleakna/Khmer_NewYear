"use client";
import { useEffect, useRef, useState } from "react";
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
    justifyContent: "space-between",
    gap: 16,
    // Padding and stacking live in .site-nav (app/search.css) so phones can
    // stack the brand above the buttons.
    backgroundColor: "rgba(31, 21, 12, 0.82)",
    borderBottom: "1px solid rgba(201, 162, 39, 0.28)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 6px 24px rgba(20, 10, 5, 0.28)",
  },
  brand: {
    color: "#FFF8EC",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
    textDecoration: "none",
  },
  right: {
    display: "flex",
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
    backgroundColor: "rgba(241, 232, 216, 0.08)",
    border: "1px solid rgba(241, 232, 216, 0.2)",
    borderRadius: 8,
    color: "#F1E8D8",
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
    backgroundColor: "rgba(241, 232, 216, 0.08)",
    border: "1px solid rgba(241, 232, 216, 0.3)",
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
    backgroundColor: "rgba(241, 232, 216, 0.14)",
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
  const [isReviewer, setIsReviewer] = useState(false);
  // Mirrors `user.id` for the auth listener, which must not read stale state.
  const userIdRef = useRef(null);

  // Ask Supabase who the session belongs to on mount, then keep the navbar in
  // sync with every sign-in, sign-out, and token refresh (including sign-out
  // or account switches made in another tab).
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // Single place that writes the user, so userIdRef always matches it.
    function applyUser(nextUser) {
      userIdRef.current = nextUser?.id ?? null;
      setUser(nextUser ?? null);
    }

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!cancelled) applyUser(error ? null : data.user);
      } catch {
        if (!cancelled) applyUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_OUT") {
          applyUser(null);
          return;
        }
        if (event === "SIGNED_IN") {
          const nextUserId = session?.user?.id ?? null;
          const previousUserId = userIdRef.current;
          // A different account signed in: reload so every page shows that
          // account's content instead of the previous user's.
          if (previousUserId && nextUserId && previousUserId !== nextUserId) {
            window.location.assign("/");
            return;
          }
          applyUser(session?.user ?? null);
          return;
        }
        if (event === "TOKEN_REFRESHED") {
          applyUser(session?.user ?? null);
        }
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Show the Review Queue link only to reviewers. This is convenience only:
  // the queue loads its data through RLS, and the database enforces the rules.
  useEffect(() => {
    if (!user) {
      setIsReviewer(false);
      return;
    }
    let cancelled = false;
    createClient()
      .rpc("is_reviewer")
      .then(({ data, error }) => {
        if (!cancelled) setIsReviewer(!error && data === true);
      })
      .catch(() => {
        if (!cancelled) setIsReviewer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // Clears the Supabase session cookies. The SDK removes the local session
      // even if the revoke request cannot reach the server.
      await createClient().auth.signOut();
    } catch {
      // Ignored on purpose: the local session is cleared either way.
    }

    // Full navigation, not router.push: this drops all in-memory page data
    // from the previous account, and the public archive then loads as an
    // anonymous visitor (published entries only).
    window.location.assign("/");
  }

  return (
    <nav className="site-nav" style={styles.nav}>
      {/* Left side: the archive name. Swap this <Link> for an <img> or
          logo component later without touching the right side. */}
      <Link
        href="/"
        style={styles.brand}
        className="hover-button site-nav-brand"
      >
        {collection.name}
      </Link>

      <div className="site-nav-right" style={styles.right}>
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
          // Signed-in users also get a link to their own entries.
          <>
            <Link
              href="/my-entries"
              style={styles.action}
              className="hover-button"
            >
              My Entries
            </Link>
            {isReviewer && (
              <Link
                href="/review"
                style={styles.action}
                className="hover-button"
              >
                Review Queue
              </Link>
            )}
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