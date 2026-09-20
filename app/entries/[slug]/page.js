import Link from "next/link";
import entries from "../../../data/entries.js";
import details from "../../../data/details.js";

const styles = {
  wrap: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "48px 20px",
  },
  image: {
    width: "100%",
    height: 420,
    objectFit: "cover",
    borderRadius: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.2,
    margin: "24px 0 16px",
  },
  text: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 1.7,
    whiteSpace: "pre-line",
    margin: "0 0 24px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    margin: "12px 0 0",
  },
  label: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#ffffff",
    margin: 0,
  },
  value: {
    fontSize: 16,
    color: "#ffffff",
    margin: 0,
  },
  back: {
    display: "inline-block",
    marginTop: 32,
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 15,
  },
  missing: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 1.6,
    margin: "48px 0 24px",
  },
};

// Pre-render one detail page per entry: /entries/num-ansom, /entries/khor, ...
export function generateStaticParams() {
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function EntryDetail({ params }) {
  const { slug } = await params;
  const entry = entries.find((item) => item.slug === slug);

  if (!entry) {
    return (
      <main style={styles.wrap}>
        <p style={styles.missing}>
          Sorry, there is no such entry in this archive.
        </p>
        <Link href="/" style={styles.back}>
          ← Back to the archive
        </Link>
      </main>
    );
  }

  // Long-form text lives in data/details.js, keyed by slug. If a slug
  // is missing there, fall back to the card blurb (entry.description).
  const text = details[slug] || entry.description;

  return (
    <main style={styles.wrap}>
      {entry.image && (
        <img src={entry.image} alt={entry.title} style={styles.image} />
      )}
      <h1 style={styles.title}>{entry.title}</h1>
      <p style={styles.text}>{text}</p>
      <p style={styles.row}>
        <span style={styles.label}>CONTRIBUTED BY</span>
        <span style={styles.value}>{entry.contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={styles.label}>PLACE</span>
        <span style={styles.value}>{entry.place}</span>
      </p>
      <Link href="/" style={styles.back}>
        ← Back to the archive
      </Link>
    </main>
  );
}