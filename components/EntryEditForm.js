"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client.js";

// Photo rules — identical to /contribute. The photos bucket enforces the
// same limits server-side (5 MB, JPG/PNG/WebP); these checks just stop a
// bad file from being queued in the first place.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Same courtesy limits as /contribute. The entries table's text columns have
// no length limit — these are form-layer only; the database stays the final
// constraint layer.
const LIMITS = {
  title: 200,
  slug: 100,
  description: 500,
  contributor: 200,
  place: 200,
};

// Form styles copied from /contribute so both forms look and behave the same.
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
  label: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    color: "#ffffff",
    display: "block",
    margin: "0 0 6px",
  },
  required: {
    color: "#ff9a9a",
  },
  optional: {
    color: "#cbd7ec",
    fontWeight: 400,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: 96,
  },
  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "inherit",
  },
  fieldError: {
    margin: "0 0 12px",
    color: "#ff9a9a",
    fontSize: 14,
  },
  hint: {
    margin: "0 0 14px",
    color: "#cbd7ec",
    fontSize: 13,
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
  button: {
    width: "100%",
    padding: "12px 16px",
    marginTop: 8,
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "inherit",
    fontWeight: 600,
  },
  currentPhoto: {
    display: "block",
    width: 180,
    height: 120,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 8,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: "#cbd7ec",
    lineHeight: 1.6,
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
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

// Same helper as /contribute: keep only the validated lowercase extension
// from a file name. The original filename is never used as a storage path.
function photoExtension(name) {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

// Small labeled field shared by all text inputs (and the description
// textarea, which sets `multiline`) — identical to the one on /contribute.
function Field({ name, label, value, error, hint, maxLength, disabled, multiline, onChange }) {
  const shared = {
    id: `edit-${name}`,
    name,
    style: multiline ? styles.textarea : styles.input,
    value,
    maxLength,
    disabled,
    "aria-invalid": Boolean(error),
    onChange,
  };

  return (
    <div style={{ margin: "0 0 4px" }}>
      <label style={styles.label} htmlFor={`edit-${name}`}>
        {label} <span style={styles.required}>*</span>
      </label>
      {multiline ? <textarea {...shared} rows={4} /> : <input {...shared} />}
      {error ? (
        <p style={styles.fieldError} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p style={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}

export default function EntryEditForm({ entry }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Prefill the form with the existing entry's values (the editable text
  // columns only — id, created_at and owner are never part of this form).
  const [form, setForm] = useState(() => ({
    title: entry.title ?? "",
    slug: entry.slug ?? "",
    description: entry.description ?? "",
    contributor: entry.contributor ?? "",
    place: entry.place ?? "",
  }));
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Old entries store the picture in `image`; new entries store a Supabase
  // Storage URL in `photo`. Show whichever exists without rebuilding paths.
  const currentPhoto = entry.photo || entry.image;

  // Ask Supabase who the session belongs to. The form is only shown to the
  // entry's owner — a courtesy, exactly like hiding the buttons. RLS is the
  // real security boundary and still filters the UPDATE below.
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (!cancelled) setUser(error ? null : data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    setPhoto(file);
    if (errors.photo) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  }

  // Same required-field and length rules as /contribute. Unlike contribute,
  // the photo is optional here: no file means "keep the existing photo".
  function validate(values, photoFile) {
    const next = {};

    if (values.title === "") {
      next.title = "Please enter a title.";
    } else if (values.title.length > LIMITS.title) {
      next.title = `Title must be ${LIMITS.title} characters or fewer.`;
    }

    if (values.slug === "") {
      next.slug = "Please enter a slug.";
    } else if (values.slug.length > LIMITS.slug) {
      next.slug = `Slug must be ${LIMITS.slug} characters or fewer.`;
    } else if (!SLUG_PATTERN.test(values.slug)) {
      next.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens.";
    }

    if (values.description === "") {
      next.description = "Please enter a description.";
    } else if (values.description.length > LIMITS.description) {
      next.description = `Description must be ${LIMITS.description} characters or fewer.`;
    }

    if (values.contributor === "") {
      next.contributor = "Please enter the contributor.";
    } else if (values.contributor.length > LIMITS.contributor) {
      next.contributor = `Contributor must be ${LIMITS.contributor} characters or fewer.`;
    }

    if (values.place === "") {
      next.place = "Please enter the place.";
    } else if (values.place.length > LIMITS.place) {
      next.place = `Place must be ${LIMITS.place} characters or fewer.`;
    }

    if (photoFile) {
      if (
        !ALLOWED_PHOTO_TYPES.includes(photoFile.type) ||
        !ALLOWED_PHOTO_EXTENSIONS.includes(photoExtension(photoFile.name))
      ) {
        next.photo = "Photo must be JPG, PNG, or WebP.";
      } else if (photoFile.size > MAX_PHOTO_BYTES) {
        next.photo = "Photo must be 5 MB or smaller.";
      }
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    // Trim every text value before validation AND before saving.
    const values = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      contributor: form.contributor.trim(),
      place: form.place.trim(),
    };

    const nextErrors = validate(values, photo);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setGeneralError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Only needed to build the photo storage path. The UPDATE itself
      // stays protected by RLS, and no owner value is ever read from the
      // form — RLS's WITH CHECK (auth.uid() = owner) is what enforces that.
      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !sessionUser) {
        setGeneralError("Please log in before editing an entry.");
        return;
      }

      let storagePath = null;
      let newPhotoUrl = null;

      // Optional photo: upload only when the user picked a new file. Same
      // OWASP rules as /contribute — the storage path is
      // <user id>/<random uuid>.<ext> and the original filename is never used.
      if (photo) {
        const ext = photoExtension(photo.name);
        storagePath = `${sessionUser.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(storagePath, photo, {
            contentType: photo.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Photo upload failed:", uploadError.message);
          setGeneralError("We couldn't upload your photo. Please try again.");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(storagePath);
        newPhotoUrl = publicUrl;
      }

      // Explicit column list — never a spread of the form object — so id,
      // created_at and owner can never be changed from here. `photo` is only
      // included when a new file was uploaded; otherwise the existing value
      // stays untouched.
      const updateFields = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        contributor: values.contributor,
        place: values.place,
      };
      if (newPhotoUrl) {
        updateFields.photo = newPhotoUrl;
      }

      // .select() is the proof. RLS can silently refuse an update (it then
      // affects zero rows without raising an error), so no error does NOT
      // mean the save succeeded — a returned row does.
      const { data: updated, error: updateError } = await supabase
        .from("entries")
        .update(updateFields)
        .eq("slug", entry.slug)
        .select();

      if (updateError) {
        console.error("Entry update failed:", updateError.message);
        // Best effort: remove the newly uploaded photo so a failed save
        // does not leave an orphaned file (same pattern as /contribute).
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from("photos")
            .remove([storagePath]);
          if (removeError) {
            console.error(
              "Couldn't clean up the uploaded photo:",
              removeError.message
            );
          }
        }
        // PostgreSQL unique-violation code: a different entry already took
        // the new slug.
        setGeneralError(
          updateError.code === "23505"
            ? "That slug is already used. Please pick a different one."
            : "That change wasn't saved"
        );
        return;
      }

      if (!updated || updated.length === 0) {
        // Zero rows: RLS refused the change or the row no longer exists.
        // Log the real situation; tell the user only the safe message.
        console.error("Entry update returned no rows:", {
          slug: entry.slug,
          updateFields,
        });
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from("photos")
            .remove([storagePath]);
          if (removeError) {
            console.error(
              "Couldn't clean up the uploaded photo:",
              removeError.message
            );
          }
        }
        setGeneralError("That change wasn't saved");
        return;
      }

      // Navigate to the saved entry (mirrors /contribute). Take the slug
      // from the returned row so a slug change lands on the new URL.
      const savedSlug = updated?.[0]?.slug ?? updated?.slug ?? values.slug;
      router.push(`/entries/${savedSlug}`);
    } catch (err) {
      // Never expose the technical error to the visitor.
      console.error("Edit failed:", err.message ?? err);
      setGeneralError("That change wasn't saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return <p style={styles.message}>Checking your session…</p>;
  }

  if (!user) {
    return (
      <>
        <p style={styles.message}>
          Please{" "}
          <Link href="/login" style={styles.link}>
            log in
          </Link>{" "}
          to edit this entry.
        </p>
        <Link
          href={`/entries/${entry.slug}`}
          style={styles.back}
          className="hover-button"
        >
          ← Back to entry
        </Link>
      </>
    );
  }

  if (user.id !== entry.owner) {
    return (
      <>
        <p style={styles.message}>You can only edit your own entries.</p>
        <Link
          href={`/entries/${entry.slug}`}
          style={styles.back}
          className="hover-button"
        >
          ← Back to entry
        </Link>
      </>
    );
  }

  return (
    <>
      <p style={styles.message}>
        Signed in as {user.email}. Every field marked * is required.
      </p>

      <form style={styles.card} onSubmit={handleSubmit} noValidate>
        {generalError && (
          <p style={styles.error} role="alert">
            {generalError}
          </p>
        )}

        <Field
          name="title"
          label="TITLE"
          value={form.title}
          error={errors.title}
          hint={`Up to ${LIMITS.title} characters. Khmer text is welcome.`}
          maxLength={LIMITS.title}
          disabled={isSubmitting}
          onChange={handleChange}
        />

        <Field
          name="slug"
          label="SLUG"
          value={form.slug}
          error={errors.slug}
          hint="Lowercase letters, numbers, and hyphens (e.g. num-ansom)."
          maxLength={LIMITS.slug}
          disabled={isSubmitting}
          onChange={handleChange}
        />

        <Field
          name="description"
          label="DESCRIPTION"
          value={form.description}
          error={errors.description}
          hint={`Up to ${LIMITS.description} characters. What does this entry tell us?`}
          maxLength={LIMITS.description}
          multiline
          disabled={isSubmitting}
          onChange={handleChange}
        />

        <Field
          name="contributor"
          label="CONTRIBUTOR"
          value={form.contributor}
          error={errors.contributor}
          maxLength={LIMITS.contributor}
          disabled={isSubmitting}
          onChange={handleChange}
        />

        <Field
          name="place"
          label="PLACE"
          value={form.place}
          error={errors.place}
          maxLength={LIMITS.place}
          disabled={isSubmitting}
          onChange={handleChange}
        />

        <div style={{ margin: "4px 0" }}>
          <label style={styles.label} htmlFor="edit-photo">
            PHOTO <span style={styles.optional}>OPTIONAL</span>
          </label>
          {currentPhoto && (
            <img
              src={currentPhoto}
              alt="Current photo"
              style={styles.currentPhoto}
            />
          )}
          <input
            id="edit-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={styles.fileInput}
            disabled={isSubmitting}
            onChange={handlePhotoChange}
          />
          {errors.photo ? (
            <p style={styles.fieldError} role="alert">
              {errors.photo}
            </p>
          ) : (
            <p style={styles.hint}>
              Leave empty to keep the current photo. JPG, PNG, or WebP, 5 MB
              or smaller.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="hover-button"
          disabled={isSubmitting}
          style={{
            ...styles.button,
            opacity: isSubmitting ? 0.5 : 1,
            cursor: isSubmitting ? "default" : "pointer",
          }}
        >
          {isSubmitting ? "Saving your changes…" : "Save changes"}
        </button>
      </form>

      <Link
        href={`/entries/${entry.slug}`}
        style={styles.back}
        className="hover-button"
      >
        ← Back to entry
      </Link>
    </>
  );
}