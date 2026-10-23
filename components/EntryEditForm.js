"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client.js";

// Photo rules — identical to /contribute. The photos bucket enforces the
// same limits server-side (5 MB, JPG/PNG/WebP); these checks just stop a
// bad file from being queued in the first place.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
// An image URL must be a direct http(s) link. The real check is loading it
// with a temporary Image in the browser (see handlePhotoUrlChange) — this
// pattern only rejects obvious nonsense early.
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;
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
  preview: {
    display: "block",
    width: "100%",
    maxHeight: 240,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 8,
  },
  photoOptions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: "0 0 10px",
  },
  optionButton: {
    padding: "6px 10px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  optionButtonActive: {
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    fontWeight: 600,
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
  // Photo input: either a local file or a pasted image URL. `filePreview` is
  // a temporary blob: URL for the selected file; `urlPreview` mirrors the URL
  // once it has actually loaded (urlStatus === "ok").
  const [photoSource, setPhotoSource] = useState("file"); // "file" | "url"
  const [photo, setPhoto] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [urlStatus, setUrlStatus] = useState("idle"); // idle|loading|ok|error
  const [urlPreview, setUrlPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards the async image check: only the newest URL's callbacks may update
  // urlStatus/urlPreview, so a slower older request cannot overwrite a newer
  // one while the user keeps typing.
  const urlCheckIdRef = useRef(0);

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
    // Preview the chosen file immediately with a temporary object URL.
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(file ? URL.createObjectURL(file) : null);
    if (errors.photo) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  }

  // Switching between "upload a file" and "paste an image URL" keeps the
  // preview of whichever source is now active (nothing is lost).
  function switchPhotoSource(source) {
    setPhotoSource(source);
    if (errors.photo) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  }

  // Try to load the pasted URL as an image. onload -> the link works and the
  // preview shows; onerror -> the link is broken or is not an image, so the
  // form shows a clear error and keeps the existing photo.
  function handlePhotoUrlChange(event) {
    const url = event.target.value.trim();
    setPhotoUrl(url);
    const checkId = ++urlCheckIdRef.current;

    if (url === "") {
      setUrlStatus("idle");
      setUrlPreview(null);
      return;
    }

    setUrlStatus("loading");
    setUrlPreview(null);

    const img = new window.Image();
    img.onload = () => {
      if (urlCheckIdRef.current !== checkId) return; // a newer URL superseded this one
      setUrlStatus("ok");
      setUrlPreview(url);
    };
    img.onerror = () => {
      if (urlCheckIdRef.current !== checkId) return;
      setUrlStatus("error");
    };
    img.src = url;
  }

  // Same required-field and length rules as /contribute. Unlike contribute,
  // the photo is optional here: no file/URL means "keep the existing photo".
  // `photoState` bundles everything the photo field needs to validate itself:
  // which source is active, the picked file, the pasted URL, and the result
  // of the browser's live image check (urlStatus).
  function validate(values, photoState) {
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

    if (photoState.source === "url") {
      const url = (photoState.url || "").trim();
      if (url !== "") {
        if (!URL_PATTERN.test(url)) {
          next.photo = "Please enter a valid image URL (http:// or https://).";
        } else if (photoState.urlStatus === "error") {
          next.photo =
            "That image link doesn't work. Check the URL and try again.";
        } else if (photoState.urlStatus === "loading") {
          next.photo =
            "The image preview is still loading. Wait a moment, then save again.";
        }
      }
    } else {
      const photoFile = photoState.file;
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

    const nextErrors = validate(values, {
      source: photoSource,
      file: photo,
      url: photoUrl,
      urlStatus,
    });
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

      // Reviewers keep direct control over an entry's status; a
      // non-reviewer's edit sends the entry back into the review queue
      // (`pending`) so a contributor can never slip a change straight onto
      // the public archive. If the RPC fails, treat the user as a
      // non-reviewer (the safer default) and reset to pending.
      const { data: isReviewer, error: reviewerError } =
        await supabase.rpc("is_reviewer");
      const isReviewerUser = !reviewerError && isReviewer === true;

      let storagePath = null;
      let newPhotoUrl = null;

      // Optional photo. A pasted URL replaces the photo directly (the photo
      // column is plain text rendered by <img src> everywhere). A picked file
      // follows the existing upload flow. Nothing chosen -> keep the current
      // photo (newPhotoUrl stays null, so the column is left untouched).
      if (photoSource === "url" && urlStatus === "ok" && photoUrl.trim() !== "") {
        newPhotoUrl = photoUrl.trim();
      } else if (photoSource === "file" && photo) {
        // Same OWASP rules as /contribute — the storage path is
        // <user id>/<random uuid>.<ext> and the original filename is never used.
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

      // Only reviewers keep the entry's current status; everyone else's save
      // resets it to `pending` so the change is reviewed before it is shown
      // to the public again.
      if (!isReviewerUser) {
        updateFields.status = "pending";
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

  // Which preview to show depends on the active source.
  const preview = photoSource === "file" ? filePreview : urlPreview;

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
          <label
            style={styles.label}
            htmlFor={
              photoSource === "file" ? "edit-photo" : "edit-photo-url"
            }
          >
            PHOTO <span style={styles.optional}>OPTIONAL</span>
          </label>
          {currentPhoto && (
            <img
              src={currentPhoto}
              alt="Current photo"
              style={styles.currentPhoto}
            />
          )}

          <div
            style={styles.photoOptions}
            role="group"
            aria-label="Photo source"
          >
            <button
              type="button"
              style={
                photoSource === "file"
                  ? { ...styles.optionButton, ...styles.optionButtonActive }
                  : styles.optionButton
              }
              aria-pressed={photoSource === "file"}
              disabled={isSubmitting}
              onClick={() => switchPhotoSource("file")}
            >
              Upload a file
            </button>
            <button
              type="button"
              style={
                photoSource === "url"
                  ? { ...styles.optionButton, ...styles.optionButtonActive }
                  : styles.optionButton
              }
              aria-pressed={photoSource === "url"}
              disabled={isSubmitting}
              onClick={() => switchPhotoSource("url")}
            >
              Paste an image link
            </button>
          </div>

          {preview && (
            <img src={preview} alt="New photo preview" style={styles.preview} />
          )}

          {photoSource === "file" ? (
            <input
              id="edit-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={styles.fileInput}
              disabled={isSubmitting}
              onChange={handlePhotoChange}
            />
          ) : (
            <input
              id="edit-photo-url"
              type="url"
              placeholder="https://example.com/photo.jpg"
              style={styles.input}
              value={photoUrl}
              disabled={isSubmitting}
              onChange={handlePhotoUrlChange}
              aria-invalid={Boolean(errors.photo)}
            />
          )}

          {errors.photo ? (
            <p style={styles.fieldError} role="alert">
              {errors.photo}
            </p>
          ) : photoSource === "file" ? (
            <p style={styles.hint}>
              Leave empty to keep the current photo. JPG, PNG, or WebP, 5 MB
              or smaller.
            </p>
          ) : (
            <p style={styles.hint}>
              Paste a direct link to an image (https://…) to replace the
              current photo. Leave empty to keep it. The link is checked
              before you save.
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