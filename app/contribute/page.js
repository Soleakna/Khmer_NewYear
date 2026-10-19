"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client.js";

// Photo rules. The photos storage bucket enforces the same limits server-side
// (5 MB, JPG/PNG/WebP) — these checks just stop a bad file from being
// uploaded in the first place.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
// An image URL must be a direct http(s) link. The real check is loading it
// with a temporary Image in the browser (see handlePhotoUrlChange) — this
// pattern only rejects obvious nonsense early.
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The entries table's text columns have no length limit, so these limits are
// form-layer courtesy only. The database is still the final constraint layer.
const LIMITS = {
  title: 200,
  slug: 100,
  description: 500,
  contributor: 200,
  place: 200,
};

const styles = {
  wrap: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "80px 20px",
  },
  kicker: {
    fontFamily: "'Courier New', monospace",
    color: "#ffffff",
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    margin: "16px 0 8px",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd7ec",
    margin: "0 0 28px",
  },
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
    outline: "none", // removes the browser's default black focus outline (the white/light border is the only focus border)
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
    outline: "none", // removes the browser's default black focus outline (the white/light border is the only focus border)
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
    outline: "none", // removes the browser's default black focus outline (the white/light border is the only focus border)
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
    outline: "none",
  },
  optionButtonActive: {
    backgroundColor: "#CA2A02",
    border: "1px solid #972002",
    fontWeight: 600,
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
    outline: "none", // removes the browser's default black focus outline (the button border is the only focus border)
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

// Keep only the validated lowercase extension from a file name. The original
// name is never used as the storage filename.
function photoExtension(name) {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

// Small labeled field shared by all text inputs (and the description
// textarea, which sets `multiline`).
function Field({ name, label, value, error, hint, maxLength, disabled, multiline, onChange }) {
  const shared = {
    id: `contribute-${name}`,
    name,
    style: multiline ? styles.textarea : styles.input,
    value,
    maxLength,
    disabled,
    // required,
    "aria-invalid": Boolean(error),
    onChange,
  };

  return (
    <div style={{ margin: "0 0 4px" }}>
      <label style={styles.label} htmlFor={`contribute-${name}`}>
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

export default function ContributePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    contributor: "",
    place: "",
  });
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

  // Ask Supabase who the current session belongs to. The form is only shown
  // to a signed-in user; hiding it is a courtesy, not a security boundary
  // (RLS policies are the real gate).
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
  // form shows a clear error and blocks submission.
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

  // All values arrive already trimmed. Returns a map of field -> message.
  // `photoState` bundles everything the photo field needs to validate itself:
  // which source is active, the picked file, the pasted URL, and the result of
  // the browser's live image check (urlStatus).
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
      if (url === "") {
        next.photo = "Please add a photo — upload a file or paste an image URL.";
      } else if (!URL_PATTERN.test(url)) {
        next.photo = "Please enter a valid image URL (http:// or https://).";
      } else if (photoState.urlStatus === "error") {
        next.photo =
          "That image link doesn't work. Check the URL and try again.";
      } else if (photoState.urlStatus === "loading") {
        next.photo =
          "The image preview is still loading. Wait a moment, then submit again.";
      }
    } else {
      const photoFile = photoState.file;
      if (!photoFile) {
        next.photo = "Please select a photo.";
      } else if (
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

    // Trim every text value before validation AND before insertion.
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

      // owner always comes from the authenticated session, never from the
      // form. Re-read the user here as well so an expired session cannot
      // submit nor hijack someone else's identity.
      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !sessionUser) {
        setGeneralError("Please log in before contributing.");
        return;
      }

      // The detail route is /entries/[slug], so the redirect after saving
      // only lands correctly if the slug is unique. The database has no
      // unique constraint on slug in this project, so check availability
      // here — before uploading anything — and ask for a different slug
      // instead of saving an entry whose page could never be resolved.
      const { data: existingSlug, error: slugCheckError } = await supabase
        .from("entries")
        .select("id")
        .eq("slug", values.slug)
        .limit(1);
      if (slugCheckError) {
        console.error("Slug availability check failed:", slugCheckError.message);
      } else if (existingSlug && existingSlug.length > 0) {
        setErrors({ slug: "That slug is already used. Please pick a different one." });
        return;
      }

      // A pasted URL goes straight into the entries.photo column (a plain
      // text column rendered directly by <img src> everywhere), so no upload
      // happens. A local file follows the existing flow: upload to the photos
      // bucket, then store the public URL.
      let photoValue;
      let storagePath = null;

      if (photoSource === "url") {
        photoValue = photoUrl.trim();
      } else {
        // OWASP file upload guidance: never trust the original filename. The
        // storage path is <user id>/<random uuid>.<ext> — only the validated
        // lowercase extension is kept.
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
          // Log the real error; show the visitor only a safe message.
          console.error("Photo upload failed:", uploadError.message);
          setGeneralError("We couldn't upload your photo. Please try again.");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(storagePath);
        photoValue = publicUrl;
      }

      // Explicit column list — never a spread of the form object, so owner,
      // id and created_at can never be supplied by the contributor.
      const { data: inserted, error: insertError } = await supabase
        .from("entries")
        .insert({
          title: values.title,
          slug: values.slug,
          description: values.description,
          contributor: values.contributor,
          place: values.place,
          photo: photoValue,
          owner: sessionUser.id,
        })
        .select("slug")
        .single();

      if (insertError) {
        console.error("Entry insert failed:", insertError.message);
        // Best effort: remove the photo that was just uploaded so a failed
        // save does not leave an orphaned file behind. (Nothing to remove in
        // URL mode — the photo was never uploaded to storage.)
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from("photos")
            .remove([storagePath]);
          if (removeError) {
            console.error("Couldn't clean up the uploaded photo:", removeError.message);
          }
        }
        // PostgreSQL unique-violation code: the slug is already taken.
        setGeneralError(
          insertError.code === "23505"
            ? "That slug is already used. Please pick a different one."
            : "We couldn't save your entry. Please try again."
        );
        return;
      }

      // Navigate to the new entry using the project's existing detail route,
      // /entries/[slug]. Take the actual slug from the inserted row
      // (defensive: supabase-js .single() returns the row object; handle the
      // array shape too) so the redirect always lands on this exact entry —
      // and only ever after the upload and insert have both succeeded.
      const newSlug = inserted?.slug ?? inserted?.[0]?.slug;
      if (!newSlug) {
        console.error(
          "Entry saved but the insert response had no slug:",
          inserted
        );
        setGeneralError("We couldn't save your entry. Please try again.");
        return;
      }
      router.push(`/entries/${newSlug}`);
    } catch (err) {
      // Never expose the technical error to the visitor.
      console.error("Contribution failed:", err.message ?? err);
      setGeneralError("We couldn't save your entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Which preview to show depends on the active source.
  const preview = photoSource === "file" ? filePreview : urlPreview;

  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>Contribute an entry</h1>

      {authLoading ? (
        <p style={styles.message}>Checking your session…</p>
      ) : !user ? (
        <>
          <p style={styles.message}>
            Please{" "}
            <Link href="/login" style={styles.link}>
              log in
            </Link>{" "}
            to add an entry to the archive.
          </p>
          <Link href="/" style={styles.back} className="hover-button">
            ← Back to home
          </Link>
        </>
      ) : (
        <>
          {/* <p style={styles.subtitle}>
            Signed in as {user.email}. Every field marked * is required.
          </p> */}

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
                  photoSource === "file"
                    ? "contribute-photo"
                    : "contribute-photo-url"
                }
              >
                PHOTO <span style={styles.required}>*</span>
              </label>

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
                <img src={preview} alt="Photo preview" style={styles.preview} />
              )}

              {photoSource === "file" ? (
                <input
                  id="contribute-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={styles.fileInput}
                  disabled={isSubmitting}
                  onChange={handlePhotoChange}
                />
              ) : (
                <input
                  id="contribute-photo-url"
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
                <p style={styles.hint}>JPG, PNG, or WebP. 5 MB or smaller.</p>
              ) : (
                <p style={styles.hint}>
                  Paste a direct link to an image (https://…). The link is
                  checked before you submit.
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
              {isSubmitting ? "Saving your entry…" : "Add entry to the archive"}
            </button>
          </form>

          <Link href="/" style={styles.back} className="hover-button">
            ← Back to home
          </Link>
        </>
      )}
    </main>
  );
}