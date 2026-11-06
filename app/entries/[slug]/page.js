import Link from "next/link";
import EntryOwnerActions from "../../../components/EntryOwnerActions";
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

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase.from("entries").select("slug");

    if (error) {
      console.error(
        "generateStaticParams: could not read entries:",
        error.message
      );
      return [];
    }
    return (data ?? [])
      .filter((entry) => typeof entry.slug === "string" && entry.slug.length > 0)
      .map((entry) => ({ slug: entry.slug }));
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

  const text = entry.description;
  const photoSrc = entry.photo || entry.image;

  return (
    <main style={styles.wrap}>
      {photoSrc && (
        <img src={photoSrc} alt={entry.title} style={styles.image} />
      )}
      <h1 style={styles.title}>{entry.title}</h1>
      <p style={styles.text}>{text}</p>
      <p style={styles.row}>
        <span style={styles.label}>Contributed by: </span>
        <span style={styles.value}>{entry.contributor}</span>
      </p>
      <p style={styles.row}>
        <span style={styles.label}>Place: </span>
        <span style={styles.value}>{entry.place}</span>
      </p>
      <EntryOwnerActions slug={entry.slug} id={entry.id} owner={entry.owner} />
      <Link href="/" style={styles.back} className="hover-button">
        ← Back to home
      </Link>
    </main>
  );
}