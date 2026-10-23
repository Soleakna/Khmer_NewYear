"use client";
import { useEffect, useState } from "react";
import collection from "../collection.config.js";
import EntryCard from "../components/EntryCard";
import HeroSection from "../components/HeroSection";
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
  card: {
    marginTop: 48,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
  },
  cardLabel: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#ffffff",
    margin: 0,
  },
  cardValue: {
    fontSize: 16,
    color: "#ffffff",
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
  // Pagination controls under the card grid.
  pager: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  pageButton: {
    padding: "8px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  pageButtonActive: {
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    fontWeight: 600,
  },
};

// The entry grid shows 6 cards per page. Pagination happens on the client,
// over the already-filtered list, so search and paging never fight. The
// Supabase query still fetches the whole archive once (see the effect below).
const ITEMS_PER_PAGE = 6;

// Typing speed for the hero title: ~120 ms per character, a smooth
// human typing pace (the brief was 100–150 ms per character).
const TYPE_DELAY_MS = 120;

export default function Home() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Typewriter title --------------------------------------------------
  // `titleChars` counts how many characters of the archive name are
  // visible. The effect below advances it one per TYPE_DELAY_MS until
  // the whole title is on screen, then stops. Starts at 1 so the first
  // letter is already visible on the very first paint (0 would leave the
  // h1 looking empty for one frame).
  const [titleChars, setTitleChars] = useState(1);

  useEffect(() => {
    // Respect users who prefer reduced motion (see the matching media
    // query in app/search.css): show the complete title immediately
    // instead of typing it out.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleChars(collection.name.length);
      return;
    }

    // Whole title is on screen — stop scheduling new characters.
    if (titleChars >= collection.name.length) return;

    const timer = window.setTimeout(
      () => setTitleChars(titleChars + 1),
      TYPE_DELAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [titleChars]);

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

  // Client-side pagination over the *filtered* list: 6 cards per page.
  // totalPages is derived from the filtered length, and safePage clamps the
  // current page so a search that narrows the results can never leave us
  // sitting on a page that no longer exists.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedEntries = filteredEntries.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <>
      {/* Automatic slideshow (same 1200px width as the content below),
          configured in components/heroSlides.js. The rest of the page
          is unchanged. */}
      <HeroSection />
      <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      {/* Typewriter title. Unrevealed characters stay in the layout with
          `visibility: hidden` (not display: none), so the h1 keeps its full
          final size from the first frame and the hero never reflows or
          jumps while the title types itself out. aria-label lets screen
          readers announce the whole title at once. */}
      <h1 style={styles.title} aria-label={collection.name}>
        {collection.name.split("").map((char, index) => (
          <span
            key={index}
            style={index < titleChars ? undefined : { visibility: "hidden" }}
          >
            {char}
          </span>
        ))}
      </h1>
      <p style={styles.description}>{collection.description}</p>

      <div style={styles.card}>
        <p style={styles.cardLabel}>CURATED BY</p>
        <p style={styles.cardValue}>{collection.curator}</p>
      </div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>SOURCE</p>
        <p style={styles.cardValue}>{collection.source}</p>
      </div>

      <input
        type="search"
        className="search-input"
        style={styles.search}
        placeholder="Search by title or description…"
        aria-label="Search entries"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setCurrentPage(1); // a new search always starts back at page 1
        }}
      />

      {error ? (
        <p style={styles.noResults}>
          Couldn't load entries from the archive: {error}
        </p>
      ) : entries === null ? (
        <p style={styles.noResults}>Loading entries…</p>
      ) : filteredEntries.length > 0 ? (
        <>
          <div className="entry-grid">
            {paginatedEntries.map((entry) => (
              <EntryCard key={entry.title} entry={entry} />
            ))}
          </div>

          {/* Pagination shows only when there is more than one page. */}
          {filteredEntries.length > ITEMS_PER_PAGE && (
            <div style={styles.pager} role="navigation" aria-label="Pagination">
              <button
                type="button"
                style={{
                  ...styles.pageButton,
                  opacity: safePage === 1 ? 0.4 : 1,
                  cursor: safePage === 1 ? "default" : "pointer",
                }}
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    style={
                      page === safePage
                        ? { ...styles.pageButton, ...styles.pageButtonActive }
                        : styles.pageButton
                    }
                    aria-current={page === safePage ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                style={{
                  ...styles.pageButton,
                  opacity: safePage === totalPages ? 0.4 : 1,
                  cursor: safePage === totalPages ? "default" : "pointer",
                }}
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
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
      </main>
    </>
  );
}
