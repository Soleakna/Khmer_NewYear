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
    // Padding lives in .site-footer (app/search.css) so phones get less.
    backgroundColor: "#CA2A02",
    borderTop: "1px solid #972002",
    color: "#ffffff",
  },
  // Column layout (desktop: three columns in one row; tablet: two columns;
  // phone: stacked) lives in the .site-footer* rules in app/search.css, so
  // media queries can change it. Only text styling stays inline here.
  left: {
    fontSize: 16,
    lineHeight: 1.6,
    margin: 0,
  },
  middle: {
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
    margin: 0,
  },
};

export default function Footer() {
  const pathname = usePathname();

  // No footer on the contribution form page.
  if (pathname === "/contribute") return null;

  return (
    <footer className="site-footer" style={styles.footer}>
      <div className="site-footer-inner">
        <p className="site-footer-left" style={styles.left}>American University of Phnom Penh.</p>

        <div className="site-footer-middle" style={styles.middle}>
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

        <p className="site-footer-right" style={styles.right}>Built in ICT 340 — Vibe Coding, Fall 2026</p>
      </div>
    </footer>
  );
}