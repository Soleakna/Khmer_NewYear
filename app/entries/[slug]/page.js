import Link from "next/link";
// import entries from "../../../data/entries.js";
import details from "../../../data/details.js";
import { createStaticClient } from "../../../lib/supabase/server.js";

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
    // fontFamily: "'Courier New', monospace",
    fontSize: 16,
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
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 600,
  },
  missing: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 1.6,
    margin: "48px 0 24px",
  },
};

// Pre-render one detail page per entry: /entries/num-ansom, /entries/khor, ...
// The old local `data/entries.js` is gone — entries now live in the Supabase
// `entries` table — so load the slugs from there. On any Supabase failure we
// return [] so the build still succeeds and routes render on demand.
export async function generateStaticParams() {
  try {
    // Build-time: no request/cookies here, so use the cookie-less server
    // client (the normal server client would throw "cookies called outside
    // a request scope" during `next build`).
    const supabase = createStaticClient();
    const { data, error } = await supabase.from("entries").select("slug");

    if (error) {
      console.error(
        "generateStaticParams: could not read entries:",
        error.message
      );
      return [];
    }

    return (data ?? []).map((entry) => ({ slug: entry.slug }));
  } catch (err) {
    console.error(
      "generateStaticParams: failed to load entry slugs:",
      err.message ?? err
    );
    return [];
  }
}

export default async function EntryDetail({ params }) {
  const { slug } = await params;

  // Entries live in the Supabase `entries` table; look this slug up there.
  // The page is public and statically pre-rendered, so it reads through the
  // cookie-less client — no viewer session is involved (and cookies() would
  // abort static generation at `next build`). A missing/erroneous entry
  // simply falls through to the message below.
  let entry = null;
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("EntryDetail: could not read entry:", error.message);
    } else {
      entry = data;
    }
  } catch (err) {
    console.error("EntryDetail: failed to load entry:", err.message ?? err);
  }

  if (!entry) {
    return (
      <main style={styles.wrap}>
        <p style={styles.missing}>
          Sorry, there is no such entry in this archive.
        </p>
        <Link href="/" style={styles.back} className="hover-button">
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
        <span style={styles.label}>CONTRIBUTED BY: </span>
        <span style={styles.value}>{entry.contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={styles.label}>PLACE: </span>
        <span style={styles.value}>{entry.place}</span>
      </p>
      <Link href="/" style={styles.back} className="hover-button">
        ← Back to home
      </Link>
    </main>
  );
}