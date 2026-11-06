"use client";
import { useEffect, useState } from "react";
import collection from "../collection.config.js";
import EntryCard from "../components/EntryCard";
import HeroSection from "../components/HeroSection";
import { createClient } from "../lib/supabase/client.js";

const styles = {
  wrap: {
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
    padding: "clamp(48px, 7vw, 96px) clamp(20px, 5vw, 32px)",
    textAlign: "left",
  },
  kicker: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#D9B64A",
    margin: "0 0 14px",
  },
  title: {
    fontSize: "clamp(38px, 6vw, 64px)",
    fontWeight: 700,
    color: "#FFF8EC",
    letterSpacing: "-0.5px",
    lineHeight: 1.08,
    margin: "0 0 20px",
  },
  description: {
    fontSize: "clamp(16px, 2vw, 19px)",
    color: "#F1E8D8",
    lineHeight: 1.75,
    margin: 0,
    maxWidth: 720,
  },
  intro: {
    maxWidth: "100%",
    margin: 0,
    color: "rgba(241, 232, 216, 0.85)",
    fontSize: "clamp(18px, 1.8vw, 17px)",
    lineHeight: 1.85,
    textAlign: "left",
  },
  card: {
    marginTop: 48,
    maxWidth: 720,
    padding: "16px 24px",
    backgroundColor: "rgba(43, 27, 18, 0.55)",
    border: "1px solid rgba(241, 232, 216, 0.16)",
    borderRadius: 14,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(20, 10, 5, 0.22)",
  },
  cardLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#D9B64A",
    margin: 0,
  },
  cardValue: {
    fontSize: 16,
    color: "#FFF8EC",
    margin: "6px 0 0",
  },
  noResults: {
    maxWidth: 700,
    margin: "48px 0 0",
    padding: "24px 28px",
    backgroundColor: "rgba(43, 27, 18, 0.55)",
    border: "1px solid rgba(241, 232, 216, 0.16)",
    borderRadius: 14,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    fontSize: 16,
    lineHeight: 1.6,
    color: "#F1E8D8",
  },
  count: {
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(217, 182, 74, 0.9)",
    marginTop: 56,
    textAlign: "center",
  },
  pager: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 40,
  },
  pageButton: {
    padding: "9px 15px",
    backgroundColor: "rgba(43, 27, 18, 0.45)",
    border: "1px solid rgba(241, 232, 216, 0.18)",
    borderRadius: 10,
    color: "#F1E8D8",
    fontSize: 15,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background-color 160ms ease, border-color 160ms ease",
  },
  pageButtonActive: {
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    fontWeight: 600,
  },
};

const ITEMS_PER_PAGE = 6;
const TYPE_DELAY_MS = 120;

export default function Home() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [titleChars, setTitleChars] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleChars(collection.name.length);
      return;
    }
    if (titleChars >= collection.name.length) return;

    const timer = window.setTimeout(
      () => setTitleChars(titleChars + 1),
      TYPE_DELAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [titleChars]);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) {

          console.error("Supabase query failed:", error.message);

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

  const filteredEntries = (entries ?? []).filter((entry) => {
    const term = query.trim().toLowerCase();
    if (term === "") return true;
    return (
      entry.title.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term)
    );
  });

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
      <HeroSection />
      <main style={styles.wrap}>
        <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
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

        {/* <div style={styles.card}>
          <p style={styles.cardLabel}>CURATED BY</p>
          <p style={styles.cardValue}>{collection.curator}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>SOURCE</p>
          <p style={styles.cardValue}>{collection.source}</p>
        </div> */}

        <p style={styles.intro}>
          Khmer New Year is one of the most important traditional celebrations in
          Cambodia. During this special occasion, people enjoy traditional dances,
          play traditional games, and take part in fun activities with their
          families and friends. Many people also visit their parents, grandparents,
          and relatives to show respect and spend quality time together. People
          visit pagodas, make offerings, and participate in traditional ceremonies
          to welcome the New Year. It is a joyful time to celebrate Cambodian
          culture, strengthen family relationships, and preserve our traditions.
        </p>

        <div className="search-box">
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search by title or description…"
            aria-label="Search entries"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1); // a new search always starts back at page 1
            }}
          />
        </div>

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