"use client";
import { useEffect, useState } from "react";
import collection from "../collection.config.js";
import EntryCard from "../components/EntryCard";
import AuthStatus from "../components/AuthStatus";
import { createClient } from "../lib/supabase/client.js";

const styles = {
  wrap: {
    maxWidth: 1200,
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
    fontSize: 48,
    fontWeight: 700,
    margin: "16px 0 12px",
    lineHeight: 1.1,
  },
  description: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 1.5,
    margin: 0,
  },
  // card: {
  //   marginTop: 48,
  //   padding: 24,
  //   backgroundColor: "rgba(255, 255, 255, 0.08)",
  //   border: "1px solid rgba(255, 255, 255, 0.18)",
  //   borderRadius: 10,
  //   backdropFilter: "blur(12px)",
  //   WebkitBackdropFilter: "blur(12px)",
  //   boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
  // },
  cardLabel: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#fffff",
    margin: 0,
  },
  cardValue: {
    fontSize: 16,
    color: "rgba(245, 235, 235, 0.08)",
    margin: "6px 0 0",
  },
  search: {
    width: "100%",
    marginTop: 48,
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(237, 233, 233, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  noResults: {
    marginTop: 48,
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
  count: {
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    color: "#ffffff",
    marginTop: 48,
  },
  footer: {
    marginTop: 64,
    paddingTop: 24,
    borderTop: "1px solid #2E3644",
    fontSize: 13,
    color: "#cbd7ec",
  },
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  // Fetch entries from Supabase once on mount. `entries === null` means the
  // query is still in progress; `error` holds a message when the query fails.
  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) {
          // RLS / permission problems and bad queries land here. Logging the
          // raw message makes the real cause visible in the browser console
          // (DevTools) instead of only as a friendly line in the page.
          console.error("Supabase query failed:", error.message);
          // PostgREST only exposes tables the role can see, so "could not
          // find the table 'public.entries'" means the build's env vars point
          // at a Supabase project that has no entries table for that key.
          const hint = /could not find the table\s*'?public\.entries'?/i.test(
            error.message
          )
            ? " The Supabase project this build connects to has no public.entries table. Check that Vercel's NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY match the ones in .env.local, and that the migrations in supabase/migrations/ were run in that project."
            : /permission denied for table entries/i.test(error.message)
              ? " The anon role cannot read the entries table — run supabase/migrations/20260926120000_allow_public_read_entries.sql in that project."
              : "";
          setError(error.message + hint);
          return;
        }
        setEntries(data ?? []);
      } catch (err) {
        // createClient() throws when the Supabase URL/key are missing, which
        // happens when a build was compiled without the NEXT_PUBLIC_* env
        // vars (e.g. after a fresh Vercel deploy). Without this guard the
        // page would sit on "Loading entries…" forever.
        console.error("Couldn't create the Supabase client:", err.message ?? err);
        if (cancelled) return;
        const isMissingConfig =
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        setError(
          isMissingConfig
            ? "Supabase isn't configured for this build. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your Vercel project's environment variables, then redeploy."
            : err.message ?? "Couldn't load entries from the archive."
        );
      }
    }

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  // Case-insensitive filter over title and description.
  // Empty (or whitespace-only) input keeps every entry visible.
  const filteredEntries = (entries ?? []).filter((entry) => {
    const term = query.trim().toLowerCase();
    if (term === "") return true;
    return (
      entry.title.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term)
    );
  });

  return (
    <main style={styles.wrap}>
      <AuthStatus />

      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>{collection.name}</h1>
      <p style={styles.description}>{collection.description}</p>

      {/* <div style={styles.card}>
        <p style={styles.cardLabel}>CURATED BY</p>
        <p style={styles.cardValue}>{collection.curator}</p>
      </div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>SOURCE</p>
        <p style={styles.cardValue}>{collection.source}</p>
      </div> */}

      <input
        type="search"
        className="search-input"
        style={styles.search}
        placeholder="Search by title or description…"
        aria-label="Search entries"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {error ? (
        <p style={styles.noResults}>
          Couldn't load entries from the archive: {error}
        </p>
      ) : entries === null ? (
        <p style={styles.noResults}>Loading entries…</p>
      ) : filteredEntries.length > 0 ? (
        <div className="entry-grid">
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.title} entry={entry} />
          ))}
        </div>
      ) : (
        <p style={styles.noResults}>
          {entries.length === 0
            ? "No entries in the archive yet. Come back soon."
            : `No results for "{query}".`}
        </p>
      )}

      {entries && (
        <p style={styles.count}>entries in the archive: {entries.length}</p>
      )}

      <footer style={styles.footer}>
        Built in ICT 340 — Vibe Coding, American University of Phnom Penh, Fall
        2026. This archive is under construction all semester. Come back in
        December.
      </footer>
    </main>
  );
}
