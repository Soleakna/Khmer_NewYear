"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client.js";

const styles = {
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  rowCompact: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
  },
  edit: {
    display: "inline-block",
    padding: "10px 14px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 600,
  },
  editCompact: {
    display: "inline-block",
    padding: "6px 10px",
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    color: "#ffffff",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  delete: {
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    color: "#ff9a9a",
    borderRadius: 8,
    fontSize: 16,
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteCompact: {
    padding: "6px 10px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    color: "#ff9a9a",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
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
};

// Props: the entry's slug (route key) and owner (auth user id). The buttons
// are shown only while the signed-in user owns this entry — visibility is UI
// convenience, NOT security. Row Level Security remains the real enforcement
// for the UPDATE/DELETE, which is why both flows verify the affected rows.
//
// `compact` renders a smaller button pair sized for the entry cards, and
// `onDeleted` replaces the default navigate-home behaviour (e.g. to reload
// the archive so a deleted card disappears immediately).
export default function EntryOwnerActions({ slug, owner, compact = false, onDeleted }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Ask Supabase who the session belongs to (same pattern as AuthStatus).
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (!cancelled) setUser(error ? null : data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete() {
    if (isDeleting) return;

    // Ask first. A confirmed dialog is still not a security gate — the
    // DELETE below must pass the entry's RLS policy all the same.
    if (!window.confirm("Delete this entry? This cannot be undone.")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const supabase = createClient();

      // .select() returns the rows the delete actually removed. RLS can
      // refuse a delete by affecting zero rows without raising an error,
      // so the returned rows — not the absence of an error — are the proof.
      const { data: deleted, error: deleteError } = await supabase
        .from("entries")
        .delete()
        .eq("slug", slug)
        .select();

      if (deleteError) {
        console.error("Entry delete failed:", deleteError.message);
        setError("That change wasn't saved");
        return;
      }

      if (!deleted || deleted.length === 0) {
        console.error("Entry delete returned no rows:", { slug });
        setError("That change wasn't saved");
        return;
      }

      // Successful delete. On a card the parent supplies `onDeleted` (it
      // reloads the archive so the removed entry disappears); otherwise
      // follow the project's navigation convention and return home.
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Entry delete failed:", err.message ?? err);
      setError("That change wasn't saved");
    } finally {
      setIsDeleting(false);
    }
  }

  const isOwner = Boolean(user) && user.id === owner;

  // Logged-out users and non-owners see nothing here.
  if (isLoading || !isOwner) return null;

  const rowStyle = compact ? styles.rowCompact : styles.row;
  const editStyle = compact ? styles.editCompact : styles.edit;
  const deleteStyle = compact ? styles.deleteCompact : styles.delete;

  return (
    <>
      {error && (
        <p style={styles.error} role="alert">
          {error}
        </p>
      )}
      <div style={rowStyle}>
        <Link
          href={`/entries/${slug}/edit`}
          style={editStyle}
          className="hover-button"
        >
          Edit
        </Link>
        <button
          type="button"
          style={{
            ...deleteStyle,
            opacity: isDeleting ? 0.5 : 1,
            cursor: isDeleting ? "default" : "pointer",
          }}
          className="hover-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </>
  );
}