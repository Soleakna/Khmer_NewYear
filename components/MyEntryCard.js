import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { STATUS_LABELS } from "../lib/statusLabels.js";

const styles = {
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
  statusKm: {
    marginLeft: 8,
    fontWeight: 400,
  },
  meta: {
    fontSize: 14,
    color: "#cbd7ec",
    margin: "4px 0 0",
  },
};

export default function MyEntryCard({ entry }) {
  const labels = STATUS_LABELS[entry.status];

  return (
    <article style={styles.card}>
      <h2 style={styles.entryTitle}>
        <Link
          href={`/entries/${entry.slug}`}
          style={styles.entryLink}
          className="hover-button"
        >
          {entry.title}
        </Link>
      </h2>
      {entry.status && labels && (
        <p style={styles.status}>
          Status: <StatusBadge status={entry.status} />
          <span style={styles.statusKm} lang="km">
            {labels.km}
          </span>
        </p>
      )}
      {entry.contributor && (
        <p style={styles.meta}>CONTRIBUTED BY: {entry.contributor}</p>
      )}
      {entry.place && <p style={styles.meta}>PLACE: {entry.place}</p>}
    </article>
  );
}