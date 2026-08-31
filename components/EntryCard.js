// Expects an "entry" prop shaped { title, description, contributor, place },
// all four strings. Missing fields render silently as blanks, so callers must pass all four.
const styles = {
  card: {
    marginTop: 48,
    padding: 24,
    backgroundColor: "#1C222C",
    border: "1px solid #2E3644",
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 8px",
    lineHeight: 1.2,
  },
  description: {
    fontSize: 16,
    color: "#97A1B3",
    lineHeight: 1.6,
    margin: "0 0 16px",
  },
  label: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#97A1B3",
    margin: "12px 0 0",
  },
  value: {
    fontSize: 16,
    margin: "4px 0 0",
  },
};

export default function EntryCard({ entry }) {
  const { title, description, contributor, place } = entry;

  return (
    <article style={styles.card}>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>
      <p style={styles.label}>CONTRIBUTED BY</p>
      <p style={styles.value}>{contributor}</p>
      <p style={styles.label}>PLACE</p>
      <p style={styles.value}>{place}</p>
    </article>
  );
}