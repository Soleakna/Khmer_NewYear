import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server.js";
import EntryEditForm from "../../../../components/EntryEditForm";

const styles = {
  wrap: {
    maxWidth: 720,
    margin: "0 auto",
  },
  kicker: {
    fontFamily: "'Courier New', monospace",
    color: "#ffffff",
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    fontWeight: 700,
    margin: "16px 0 28px",
    lineHeight: 1.2,
  },
  missing: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 1.6,
    margin: "48px 0 24px",
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
};

export default async function EditEntryPage({ params }) {
  const { slug } = await params;
  let entry = null;
  try {
    // Signed-in client: lets the owner (and reviewers) open unpublished entries.
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("EditEntryPage: could not read entry:", error.message);
    } else {
      entry = data;
    }
  } catch (err) {
    console.error("EditEntryPage: failed to load entry:", err.message ?? err);
  }

  if (!entry) {
    return (
      <main className="page-wrap" style={styles.wrap}>
        <p style={styles.missing}>
          Sorry, there is no such entry in this archive.
        </p>
        <Link href="/" style={styles.back} className="hover-button">
          ← Back to the archive
        </Link>
      </main>
    );
  }

  return (
    <main className="page-wrap" style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 className="page-title" style={styles.title}>Edit entry</h1>
      <EntryEditForm entry={entry} />
    </main>
  );
}