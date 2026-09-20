import Link from "next/link";

// Expects an "entry" prop shaped { title, description, contributor, place, slug },
// all four strings. Missing fields render silently as blanks, so callers must pass all four.
const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    height: "90%",
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 8px",
    lineHeight: 1.2,
  },
  description: {
    // Grows to fill the card, pinning the CONTRIBUTED BY / PLACE / Explore
    // block to the bottom so it lines up across all cards. Long description
    // → small gap below it; short description → wide gap (by design).
    flexGrow: 1,
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 1.6,
    margin: 0,
  },
  label: {
    // fontFamily: "'Courier New', monospace",
    fontSize: 14,
    color: "#ffffff",
    margin: "2px 0 0",
  },
  value: {
    fontSize: 16,
    color: "#ffffff",
    margin: "4px 0 0",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    margin: "2px 0 0",
  },
  image: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 16,
  },
  link: {
    alignSelf: "flex-start",
    marginTop: 16,
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#FFFFFF",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
};

export default function EntryCard({ entry }) {
  const { title, description, contributor, place, image, slug } = entry;

  return (
    <article style={styles.card}>
      {image && <img src={image} alt={title} style={styles.image} />}
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>CONTRIBUTED BY</span>
        <span style={{ ...styles.value, margin: 0 }}>{contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>PLACE</span>
        <span style={{ ...styles.value, margin: 0 }}>{place}</span>
      </p>
      <Link href={`/entries/${slug}`} style={styles.link}>
        Explore more →
      </Link>
    </article>
  );
}