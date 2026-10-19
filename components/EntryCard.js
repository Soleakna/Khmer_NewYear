import Link from "next/link";
import EntryOwnerActions from "./EntryOwnerActions";

// Word-boundary rules for the card's description limit.
//
// Khmer is usually written without spaces between words, so counting "words"
// with split(/\s+/) would treat a whole Khmer sentence as one word and a long
// Khmer description would never be cut. Intl.Segmenter applies the Unicode
// word-boundary algorithm (UAX #29); for Khmer text the engine uses its
// built-in Khmer dictionary and for English it breaks on spaces — one code
// path handles both scripts. Older browsers/Node without Intl.Segmenter fall
// back to whitespace splitting (still correct for English).
let wordSegmenter = null;
if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
  wordSegmenter = new Intl.Segmenter("km", { granularity: "word" });
}

// Words in `text`. With Intl.Segmenter each item keeps its { segment, index,
// isWordLike } shape (needed to rebuild the truncated string); the older
// fallback yields plain strings.
function splitWords(text) {
  if (wordSegmenter) {
    return [...wordSegmenter.segment(text)].filter((s) => s.isWordLike);
  }
  return text.split(/\s+/).filter(Boolean);
}

// Card display helper: keep only the first `maxWords` words of a description.
// The full text is preserved in Supabase and on the detail page; only the card
// is shortened. "..." is appended only when the text was actually cut. The
// `!text` guard mirrors the old `{description}` render for rows whose
// description column is NULL (the schema allows it) instead of crashing.
function truncateWords(text, maxWords = 35) {
  if (!text) return text;

  const words = splitWords(text);

  if (words.length <= maxWords) {
    return text;
  }

  if (wordSegmenter) {
    // Cut the original text just past the last kept word so the card keeps
    // the author's exact spacing and punctuation, then append "...".
    const last = words[maxWords - 1];
    return text.slice(0, last.index + last.segment.length).trimEnd() + "...";
  }

  return words.slice(0, maxWords).join(" ") + "...";
}

// Expects an "entry" prop shaped { title, description, contributor, place,
// photo|image, slug }. The photo may come from either column: old entries
// store their picture in `image` (full URL or repository path such as
// /photos/x.jpg) while new contributions store a Supabase Storage URL in
// `photo`. Both render through <img src> as-is — never re-prefixed.
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
    color: "",
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
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#FFFFFF",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
  // Bottom row of the card: "Explore more" on the left, the owner-only
  // Edit/Delete actions on the right.
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
};

export default function EntryCard({ entry }) {
  const { title, description, contributor, place, photo, image, slug } = entry;
  // Old entries store the picture in `image`; new contributions store a
  // Supabase Storage URL in `photo`. Both are full URLs/paths, so render
  // whichever exists directly — never rebuild the path with a "/photos/"
  // prefix, which would break entries whose photo is already a complete URL.
  const photoSrc = photo || image;

  return (
    <article style={styles.card} className="hover-card">
      {photoSrc && <img src={photoSrc} alt={title} style={styles.image} />}
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{truncateWords(description, 35)}</p>
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>CONTRIBUTED BY : </span>
        <span style={{ ...styles.value, margin: 0 }}>{contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={{ ...styles.label, margin: 0 }}>PLACE : </span>
        <span style={{ ...styles.value, margin: 0 }}>{place}</span>
      </p>
      <div style={styles.footer}>
        <Link
          href={`/entries/${slug}`}
          style={styles.link}
          className="hover-button"
        >
          Explore more →
        </Link>
        {/* Same owner-gated component as the detail page: only the owner
            sees Edit/Delete. A successful delete reloads the archive so the
            removed card disappears immediately. */}
        <EntryOwnerActions
          slug={slug}
          owner={entry.owner}
          compact
          onDeleted={() => window.location.reload()}
        />
      </div>
    </article>
  );
}