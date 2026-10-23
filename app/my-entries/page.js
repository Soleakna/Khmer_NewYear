"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client.js";

const styles = {
  wrap: {
    maxWidth: 900,
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
    margin: "16px 0 8px",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd7ec",
    margin: "0 0 28px",
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: "#cbd7ec",
    lineHeight: 1.6,
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
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
  entryLink: {
    color: "#ffffff",
    textDecoration: "none",
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  status: {
    fontSize: 14,
    fontWeight: 600,
    color: "#cbd7ec",
    margin: "8px 0 0",
  },
  meta: {
    fontSize: 14,
    color: "#cbd7ec",
    margin: "4px 0 0",
  },
  box: {
    marginTop: 28,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    fontSize: 16,
    color: "#ffffff",
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

// The entries.status column stores one of three values; show it in plain
// English so contributors know where their entry is in the review flow.
const STATUS_LABELS = {
  pending: "Pending review",
  published: "Published",
  returned: "Returned for changes",
};

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Unknown";
}

export default function MyEntriesPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  // Ask Supabase who the session belongs to (same pattern as the Navbar),
  // then load only that user's entries — `owner` must come from the session,
  // never from the URL or any form input, and RLS backs it up.
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const supabase = createClient();
        const { data, error: userError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (userError || !data.user) {
          setUser(null);
          setAuthLoading(false);
          return;
        }
        setUser(data.user);

        const { data: rows, error: entriesError } = await supabase
          .from("entries")
          .select("*")
          .eq("owner", data.user.id)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (entriesError) {
          console.error("My entries query failed:", entriesError.message);
          setError(entriesError.message);
        } else {
          setEntries(rows ?? []);
        }
      } catch (err) {
        console.error("Couldn't load my entries:", err.message ?? err);
        if (!cancelled) {
          setError(err.message ?? "Couldn't load your entries.");
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>My entries</h1>

      {authLoading ? (
        <p style={styles.message}>Checking your session…</p>
      ) : !user ? (
        <>
          <p style={styles.message}>
            Please{" "}
            <Link href="/login" style={styles.link}>
              log in
            </Link>{" "}
            to see your entries.
          </p>
          <Link href="/" style={styles.back} className="hover-button">
            ← Back to home
          </Link>
        </>
      ) : error ? (
        <p style={styles.box}>
          Couldn't load your entries from the archive: {error}
        </p>
      ) : entries === null ? (
        <p style={styles.message}>Loading your entries…</p>
      ) : entries.length === 0 ? (
        <>
          <p style={styles.box}>You haven't contributed any entries yet.</p>
          <Link href="/contribute" style={styles.back} className="hover-button">
            Contribute an entry
          </Link>
        </>
      ) : (
        <>
          <p style={styles.subtitle}>
            Signed in as {user.email}. Only your entries are listed here.
          </p>
          <div style={styles.list}>
            {entries.map((entry) => (
              <article key={entry.id} style={styles.card}>
                <h2 style={styles.entryTitle}>
                  <Link
                    href={`/entries/${entry.slug}`}
                    style={styles.entryLink}
                    className="hover-button"
                  >
                    {entry.title}
                  </Link>
                </h2>
                <p style={styles.status}>Status: {statusLabel(entry.status)}</p>
                {entry.contributor && (
                  <p style={styles.meta}>CONTRIBUTED BY: {entry.contributor}</p>
                )}
                {entry.place && <p style={styles.meta}>PLACE: {entry.place}</p>}
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}