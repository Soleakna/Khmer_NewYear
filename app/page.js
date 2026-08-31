import collection from "../collection.config.js";
import EntryCard from "../components/EntryCard";

const styles = {
  wrap: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "80px 24px",
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
    lineHeight: 1.6,
    margin: 0,
  },
  card: {
    marginTop: 48,
    padding: 24,
    backgroundColor: "#1C222C",
    border: "1px solid #2E3644",
    borderRadius: 10,
  },
  cardLabel: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#97A1B3",
    margin: 0,
  },
  cardValue: {
    fontSize: 16,
    margin: "6px 0 0",
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
  const entries = [
    {
      title: "Num Ansom",
      description:
        "Sticky rice cake wrapped in banana leaf, made by families in the days before Khmer New Year. My mother still makes it every year — សំណុំបាយបិណ្ឌ",
      contributor: "My mother",
      place: "Phnom Penh, Cambodia",
    },
    {
      title: "Khor",
      description:
        "A slow-braised Cambodian dish, often pork or fish cooked with palm sugar and fish sauce until dark and tender, served during Khmer New Year gatherings.",
      contributor: "My grandmother",
      place: "A village pagoda in Kratie",
    },
  ];

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

      {entries.map((entry) => (
        <EntryCard key={entry.title} entry={entry} />
      ))}

      <p style={styles.count}>entries in the archive: {entries.length} (for now)</p>

      <footer style={styles.footer}>
        Built in ICT 340 — Vibe Coding, American University of Phnom Penh, Fall
        2026. This archive is under construction all semester. Come back in
        December.
      </footer>
    </main>
  );
}
