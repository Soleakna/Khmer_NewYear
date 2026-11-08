"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client.js";
import ReviewEntryCard from "./ReviewEntryCard";

const styles = {
  message: {
    marginTop: 20,
    fontSize: 16,
    color: "#cbd7ec",
    lineHeight: 1.6,
  },
  error: {
    margin: "0 0 12px",
    padding: "10px 12px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#ff9a9a",
    fontSize: 14,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 24,
  },
};

// Loads pending entries for reviewers. Non-reviewers see a message instead.
// The real protection is RLS: only reviewers can read other people's pending rows.
export default function ReviewQueue() {
  const [status, setStatus] = useState("checking"); // checking | denied | ready
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: isReviewer, error: reviewerError } =
          await supabase.rpc("is_reviewer");
        if (cancelled) return;
        if (reviewerError || isReviewer !== true) {
          setStatus("denied");
          return;
        }

        const { data, error: queryError } = await supabase
          .from("entries")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true });
        if (cancelled) return;

        if (queryError) {
          console.error("Review queue query failed:", queryError.message);
          setError("Couldn't load the review queue.");
        } else {
          setEntries(data ?? []);
        }
        setStatus("ready");
      } catch (err) {
        console.error("Review queue failed:", err.message ?? err);
        if (!cancelled) {
          setError("Couldn't load the review queue.");
          setStatus("ready");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remove an entry from the list once it has been published or returned.
  function handleDecided(id) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  if (status === "checking") {
    return <p style={styles.message}>Checking your access…</p>;
  }
  if (status === "denied") {
    return (
      <p style={styles.message}>
        Only reviewers can open the review queue. Log in with a reviewer account.
      </p>
    );
  }
  if (error) {
    return (
      <p style={styles.error} role="alert">
        {error}
      </p>
    );
  }
  if (entries.length === 0) {
    return <p style={styles.message}>No entries are waiting for review.</p>;
  }

  return (
    <div style={styles.list}>
      {entries.map((entry) => (
        <ReviewEntryCard
          key={entry.id}
          entry={entry}
          onDecided={handleDecided}
        />
      ))}
    </div>
  );
}
