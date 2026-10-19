"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Site-wide footer: a red band in the archive accent color used by the card
// "Explore more" and Navbar "Contribute" buttons (#CA2A02). Left and right
// columns carry the school name and the build credit; the middle column is
// the Quick link menu. The contribution form page (/contribute) intentionally
// does not render the footer — the form is the only thing on that page.
const styles = {
  footer: {
    width: "100%",
    boxSizing: "border-box",
    padding: "36px 20px",
    backgroundColor: "#CA2A02",
    borderTop: "1px solid #972002",
    color: "#ffffff",
  },
  // Three forced columns in ONE row. The explicit "1fr auto 1fr" grid tracks
  // pin the middle section to the visual center and make it impossible for
  // any section to wrap to another row (grid columns never wrap on their
  // own), on desktop and mobile alike.
  inner: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    columnGap: 32,
  },
  left: {
    fontSize: 16,
    lineHeight: 1.6,
    whiteSpace: "nowrap",
    margin: 0,
    justifySelf: "start",
  },
  middle: {
    justifySelf: "center",
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 8px",
  },
  links: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  // textDecoration is intentionally NOT set inline — underlining lives in
  // .footer-link in search.css so it can animate and exist only on hover.
  link: {
    color: "#ffffff",
    fontSize: 16,
    textTransform: "capitalize",
    width: "fit-content",
  },
  right: {
    fontSize: 16,
    lineHeight: 1.6,
    whiteSpace: "nowrap",
    margin: 0,
    justifySelf: "end",
  },
};

export default function Footer() {
  const pathname = usePathname();

  // No footer on the contribution form page.
  if (pathname === "/contribute") return null;

  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <p style={styles.left}>American University of Phnom Penh.</p>

        <div style={styles.middle}>
          <p style={styles.title}>Quick link</p>
          <div style={styles.links}>
            <Link
              href="/"
              style={styles.link}
              className="footer-link"
              onClick={() => {
                // Already on the archive page? A soft link would keep the
                // current client state (e.g. page 2), so reload to really
                // show the first page of cards. From any other page the
                // link simply lands on "/" fresh, which is page 1.
                if (pathname === "/") window.location.reload();
              }}
            >
              archive
            </Link>
            <Link
              href="/contribute"
              style={styles.link}
              className="footer-link"
            >
              contribute
            </Link>
          </div>
        </div>

        <p style={styles.right}>Built in ICT 340 — Vibe Coding, Fall 2026</p>
      </div>
    </footer>
  );
}