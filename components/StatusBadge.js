
import { STATUS_LABELS } from "../lib/statusLabels.js";

// Colours per status, tuned for the small pill. The labels themselves live in
// lib/statusLabels.js so every page in the archive shows the same wording.
const STATUS_STYLES = {
  pending: { background: "#FEF3C7", color: "#92400E" },
  published: { background: "#DCFCE7", color: "#166534" },
  returned: { background: "#FEE2E2", color: "#991B1B" },
};

const badge = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.4,
  whiteSpace: "nowrap",
};

export default function StatusBadge({ status }) {
  const labels = STATUS_LABELS[status];
  const style = STATUS_STYLES[status];
  // Unknown / missing status: render nothing rather than a misleading chip.
  if (!labels || !style) return null;

  return (
    <span
      style={{
        ...badge,
        backgroundColor: style.background,
        color: style.color,
      }}
    >
      {labels.en}
    </span>
  );
}