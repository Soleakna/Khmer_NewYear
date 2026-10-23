"use client";
import { useEffect, useState } from "react";
import slides from "./heroSlides";

// Fallback display time when a slide omits durationMs: 5 seconds.
const DEFAULT_DURATION_MS = 5000;

const styles = {
  section: {
    position: "relative",
    // Same width and centering as the content column on the home page
    // (app/page.js wraps it in a 1200px max-width column).
    width: "100%",
    maxWidth: 1600,
    // Small gap below the sticky navbar; `auto` on the sides keeps the
    // hero centred on the page.
    margin: "0 auto 0",
    // Previous height (clamp(420px, 58vh, 660px)) increased by exactly 100px.
    minHeight: "clamp(470px, calc(58vh + 100px), 710px)",
    overflow: "hidden",
    backgroundColor: "#14181F",
  },
  slide: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    // A touch darker at the bottom because the text now sits there.
    background:
      "linear-gradient(180deg, rgba(20, 24, 31, 0.35) 0%, rgba(20, 24, 31, 0.85) 100%)",
  },
  content: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    textAlign: "center",
    padding: "clamp(36px, 7vh, 64px) clamp(24px, 5vw, 56px)",
  },
  heading: {
    fontSize: "clamp(30px, 5.2vw, 54px)",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.15,
    margin: "0 0 12px",
    maxWidth: 900,
  },
  subtitle: {
    fontSize: "clamp(15px, 2vw, 19px)",
    color: "#ffffff",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 640,
  },
  
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(20, 24, 31, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  arrowLeft: {
    left: "clamp(12px, 3vw, 24px)",
  },
  arrowRight: {
    right: "clamp(12px, 3vw, 24px)",
  },
};

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideCount = slides.length;

  // Auto-advance: show each slide for its own durationMs (default 5 s), then
  // fade to the next one. (currentIndex + 1) % slideCount wraps the last slide
  // back to the first, so the loop never ends. The timeout is cleared before
  // every next tick and on unmount, so no timer leaks.
  useEffect(() => {
    if (slideCount === 0) return;

    const durationMs =
      slides[currentIndex].durationMs ?? DEFAULT_DURATION_MS;
    const timer = window.setTimeout(
      () => setCurrentIndex((currentIndex + 1) % slideCount),
      durationMs
    );

    return () => window.clearTimeout(timer);
  }, [currentIndex, slideCount]);

  // No configured slides — render nothing instead of crashing.
  if (slideCount === 0) return null;

  // Manual navigation: wraps around at both ends (previous on the first slide
  // goes to the last, next on the last slide goes to the first). Changing
  // currentIndex also restarts the 5-second auto-advance timer, because the
  // effect above re-runs on every change (its cleanup clears the old timer).
  const goToPrevious = () =>
    setCurrentIndex((index) => (index - 1 + slideCount) % slideCount);

  const goToNext = () =>
    setCurrentIndex((index) => (index + 1) % slideCount);

  const current = slides[currentIndex];

  return (
    <section style={styles.section} aria-label="Khmer New Year highlights">
      {/* All slides stay stacked on top of each other; only the active one is
          opaque, so each change is a smooth cross-fade (see .hero-slide in
          app/search.css, where reduced motion switches the fade off). */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className="hero-slide"
          aria-hidden={index !== currentIndex}
          style={{
            ...styles.slide,
            opacity: index === currentIndex ? 1 : 0,
          }}
        >
          <img src={slide.image} alt={slide.heading} style={styles.image} />
        </div>
      ))}

      <div style={styles.overlay} />

      <div style={styles.content}>
        <h2 style={styles.heading}>{current.heading}</h2>

        {current.subtitle && (
          <p style={styles.subtitle}>{current.subtitle}</p>
        )}
      </div>

      <button
        type="button"
        className="hero-arrow"
        style={{ ...styles.arrow, ...styles.arrowLeft }}
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        className="hero-arrow"
        style={{ ...styles.arrow, ...styles.arrowRight }}
        onClick={goToNext}
        aria-label="Next slide"
      >
        <span aria-hidden="true">›</span>
      </button>
    </section>
  );
}
