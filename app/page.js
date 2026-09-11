"use client";
import { useState } from "react";
import collection from "../collection.config.js";
import EntryCard from "../components/EntryCard";
import entries from "../data/entries.js";

const styles = {
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "80px 20px",
  },
  kicker: {
    fontFamily: "'Courier New', monospace",
    color: "#2EE6A8",
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
    color: "#97A1B3",
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
    color: "#99F6E4",
    margin: 0,
  },
  cardValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.08)",
    margin: "6px 0 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    rowGap: 80,
    columnGap: 28,
    marginTop: 48,
  },
  search: {
    width: "100%",
    marginTop: 48,
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    color: "#2DD4BF",
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
    color: "#99F6E4",
  },
  count: {
    fontFamily: "'Courier New', monospace",
    fontSize: 14,
    color: "#2EE6A8",
    marginTop: 48,
  },
  footer: {
    marginTop: 64,
    paddingTop: 24,
    borderTop: "1px solid #2E3644",
    fontSize: 13,
    color: "#5A6373",
  },
};

export default function Home() {
  const [query, setQuery] = useState("");

  // Case-insensitive filter over title and description.
  // Empty (or whitespace-only) input keeps every entry visible.
  const filteredEntries = entries.filter((entry) => {
    const term = query.trim().toLowerCase();
    if (term === "") return true;
    return (
      entry.title.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term)
    );
  });

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>{collection.name}</h1>
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
        style={styles.search}
        placeholder="Search by title or description…"
        aria-label="Search entries"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {filteredEntries.length > 0 ? (
        <div style={styles.grid}>
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.title} entry={entry} />
          ))}
        </div>
      ) : (
        <p style={styles.noResults}>No results for "{query}".</p>
      )}

      <p style={styles.count}>entries in the archive: {entries.length} (for now)</p>

      <footer style={styles.footer}>
        Built in ICT 340 — Vibe Coding, American University of Phnom Penh, Fall
        2026. This archive is under construction all semester. Come back in
        December.
      </footer>
    </main>
  );
}
