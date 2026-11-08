import Link from "next/link";
import ReviewQueue from "../../components/ReviewQueue";

const styles = {
  wrap: {
    maxWidth: 900,
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

// Reviewer Queue. Access is checked by ReviewQueue (is_reviewer) and enforced
// by the entries RLS policies, so this page is only a container.
export default function ReviewQueuePage() {
  return (
    <main style={styles.wrap}>
      <p style={styles.kicker}>KHMER LIVING ARCHIVE</p>
      <h1 style={styles.title}>Review queue</h1>
      <ReviewQueue />
      <Link href="/" style={styles.back} className="hover-button">
        ← Back to home
      </Link>
    </main>
  );
}
