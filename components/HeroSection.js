"use client";
import { useEffect, useState } from "react";
import slides from "./heroSlides";

const DEFAULT_DURATION_MS = 5000;

const styles = {
  section: {
    position: "relative",
    width: "100%",
    maxWidth: 1600,
    margin: "0 auto 0",
    // Previous height (clamp(420px, 58vh, 660px)) increased by exactly 100px.
    minHeight: "clamp(470px, calc(58vh + 100px), 710px)",
    overflow: "hidden",
    backgroundColor: "#2B1B12",
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
    // Warm dark-brown scrim: lightest mid-image so the photo still breathes,
    // strongest just behind the heading and subtitle for readability.
    background:
      "linear-gradient(180deg, rgba(31, 21, 12, 0.5) 0%, rgba(31, 21, 12, 0.26) 45%, rgba(31, 21, 12, 0.88) 100%)",
  },
  content: {
    // Middle-bottom placement: centered horizontally, and parked at ~60% of
    // the hero height — clearly below the vertical center, clearly above the
    // very bottom edge.
    position: "absolute",
    top: "60%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "0 clamp(24px, 5vw, 56px)",
  },
  kicker: {
    margin: "0 0 16px",
    fontSize: "clamp(12px, 1.4vw, 14px)",
    fontWeight: 600,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "#D9B64A",
    textShadow: "0 1px 12px rgba(20, 10, 5, 0.5)",
  },
  divider: {
    width: 56,
    height: 2,
    border: "none",
    margin: "0 0 18px",
    background:
      "linear-gradient(90deg, rgba(201, 162, 39, 0), rgba(201, 162, 39, 0.85), rgba(201, 162, 39, 0))",
  },
  heading: {
    fontSize: "clamp(32px, 5.4vw, 58px)",
    fontWeight: 700,
    color: "#FFF8EC",
    letterSpacing: "-0.5px",
    lineHeight: 1.12,
    margin: "0 0 14px",
    maxWidth: 900,
    textShadow: "0 2px 24px rgba(20, 10, 5, 0.55)",
  },
  subtitle: {
    fontSize: "clamp(15px, 2vw, 18px)",
    color: "rgba(255, 248, 236, 0.9)",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 560,
    textShadow: "0 1px 16px rgba(20, 10, 5, 0.45)",
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
    boxSizing: "border-box",
    padding: 0 ,
    margin: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(31, 21, 12, 0.55)",
    border: "1px solid rgba(201, 162, 39, 0.35)",
    color: "#F7F1E3",
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

  if (slideCount === 0) return null;

  const goToPrevious = () =>
    setCurrentIndex((index) => (index - 1 + slideCount) % slideCount);

  const goToNext = () =>
    setCurrentIndex((index) => (index + 1) % slideCount);

  const current = slides[currentIndex];

  return (
    <section style={styles.section} aria-label="Khmer New Year highlights">
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
        <p style={styles.kicker}>សួស្តីឆ្នាំថ្មី · KHMER LIVING ARCHIVE</p>
        <div style={styles.divider} aria-hidden="true" />
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
        <span aria-hidden="true"   style={{ display: "block", lineHeight: 1, transform: "translateY(-1px)" }}
        >‹</span>
      </button>
      <button
        type="button"
        className="hero-arrow"
        style={{ ...styles.arrow, ...styles.arrowRight }}
        onClick={goToNext}
        aria-label="Next slide"
      >
        <span aria-hidden="true"   style={{ display: "block", lineHeight: 1, transform: "translateY(-1px)" }}
        >›</span>
      </button>
    </section>
  );
}