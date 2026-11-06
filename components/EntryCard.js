"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EntryOwnerActions from "./EntryOwnerActions";

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    padding: 18,
    backgroundColor: "rgba(43, 27, 18, 0.6)",
    border: "1px solid rgba(241, 232, 216, 0.14)",
    borderRadius: 14,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 12px 32px rgba(20, 10, 5, 0.25)",
  },

  textBlock: {
    display: "flex",
    flexDirection: "column",
    height: 146.4,
    flexShrink: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#FFF8EC",
    lineHeight: 1.2,
    margin: "0 0 12px", // the small, consistent gap between title and description
    flexShrink: 0,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  },
  description: {
    fontSize: 16,
    textAlign: "left",
    color: "#ffffff",
    lineHeight: 1.6,
    margin: 0,
    flexGrow: 1, // absorbs the space a one-line title leaves behind
    flexShrink: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
  },
  separator: {
    height: 1,
    backgroundColor: "#CA2A02",
    border: "none",
    margin: "12px 0 10px",
    flexShrink: 0,
  },
  spacer: {
    flexGrow: 1,
  },
  label: {
    // fontFamily: "'Courier New', monospace",
    fontSize: 14,
    color: "#D9B64A",
    margin: "2px 0 0",
  },
  value: {
    fontSize: 16,
    color: "#F1E8D8",
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
    borderRadius: 10,
    marginBottom: 12, // uniform 12px gap before the title
    flexShrink: 0,
  },
  link: {
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#FFFFFF",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    flexShrink: 0,
  },
};

export default function EntryCard({ entry }) {
  const router = useRouter();
  const { title, description, contributor, place, photo, image, slug } = entry;
  const photoSrc = photo || image;
  function handleCardClick(event) {
    if (event.target.closest("a, button")) return;
    router.push(`/entries/${slug}`);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`/entries/${slug}`);
    }
  }

  return (
    <article
      style={styles.card}
      className="hover-card"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {photoSrc && <img src={photoSrc} alt={title} style={styles.image} />}
      <div style={styles.textBlock}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.description}>{description}</p>
      </div>
      <div style={styles.separator} aria-hidden="true" />
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>Ccontributed by : </span>
        <span style={{ ...styles.value, margin: 0 }}>{contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>Place : </span>
        <span style={{ ...styles.value, margin: 0 }}>{place}</span>
      </p>
      <div style={styles.spacer} aria-hidden="true" />
      <div style={styles.footer}>
        <Link
          href={`/entries/${slug}`}
          style={styles.link}
          className="hover-button"
        >
          Explore more →
        </Link>
        <EntryOwnerActions
          slug={slug}
          id={entry.id}
          owner={entry.owner}
          compact
          onDeleted={() => window.location.reload()}
        />
      </div>
    </article>
  );
}