"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client.js";
import StatusBadge from "./StatusBadge";

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
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 8px",
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
  },
  meta: {
    fontSize: 14,
    color: "#cbd7ec",
    margin: "4px 0 0",
  },
  text: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 1.6,
    margin: "12px 0 0",
    whiteSpace: "pre-line",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  publish: {
    padding: "10px 14px",
    backgroundColor: "#2E7D32",
    border: "1px solid #1B5E20",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  returned: {
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    margin: "12px 0 0",
    color: "#ff9a9a",
    fontSize: 14,
  },
};

// One pending entry with Publish and Return. The database decides whether the
// update is allowed (reviewers only, status limited to published or returned).
// A refused update changes zero rows, so the returned rows are the proof.
export default function ReviewEntryCard({ entry, onDecided }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Reviewers cannot publish or return their own entries (the database
  // trigger refuses it), so the buttons are disabled for those rows.
  const isOwnEntry = currentUserId !== null && currentUserId === entry.owner;

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setCurrentUserId(data?.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function decide(status) {
    if (isSaving || isOwnEntry) return;
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("entries")
        .update({ status })
        .eq("id", entry.id)
        .select();

      if (updateError) {
        // A real database error, e.g. the trigger raised an exception.
        console.error("Review update failed:", updateError.message);
        setError(
          "That decision wasn't saved. Please check that you are signed in as a reviewer."
        );
        return;
      }
      if (!data || data.length === 0) {
        // Zero rows: RLS hid the row or blocked the update. Usually means the
        // reviewer policy is missing or this account is not in reviewers.
        console.error("Review update changed no rows:", { id: entry.id, status });
        setError(
          "That decision wasn't saved. Your account may not have reviewer access."
        );
        return;
      }
      onDecided(entry.id);
    } catch (err) {
      console.error("Review update failed:", err.message ?? err);
      setError("That decision wasn't saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article style={styles.card}>
      <h2 style={styles.title}>
        {entry.slug ? (
          <Link href={`/entries/${entry.slug}`} style={styles.link}>
            {entry.title}
          </Link>
        ) : (
          entry.title
        )}
      </h2>
      <StatusBadge status={entry.status} />
      {entry.contributor && (
        <p style={styles.meta}>CONTRIBUTED BY: {entry.contributor}</p>
      )}
      {entry.place && <p style={styles.meta}>PLACE: {entry.place}</p>}
      {entry.description && <p style={styles.text}>{entry.description}</p>}
      {entry.description_km && (
        <p style={styles.text} lang="km">
          {entry.description_km}
        </p>
      )}
      <div style={styles.actions}>
        <button
          type="button"
          className="hover-button"
          style={{ ...styles.publish, opacity: isSaving || isOwnEntry ? 0.5 : 1 }}
          onClick={() => decide("published")}
          disabled={isSaving || isOwnEntry}
        >
          Publish
        </button>
        <button
          type="button"
          className="hover-button"
          style={{ ...styles.returned, opacity: isSaving || isOwnEntry ? 0.5 : 1 }}
          onClick={() => decide("returned")}
          disabled={isSaving || isOwnEntry}
        >
          Return
        </button>
      </div>
      {isOwnEntry && (
        <p style={styles.error}>
          This is your own entry. Another reviewer must publish or return it.
        </p>
      )}
      {error && (
        <p style={styles.error} role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
