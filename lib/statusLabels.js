// lib/statusLabels.js
//
// Single source of truth for the archive's three entry statuses and their
// labels. StatusBadge and the entry-list cards import from here so the
// English and Khmer wording can never drift apart.

export const ENTRY_STATUSES = ["pending", "published", "returned"];

export const STATUS_LABELS = {
  pending: {
    en: "Pending",
    km: "កំពុងរង់ចាំការពិនិត្យ",
  },
  published: {
    en: "Published",
    km: "បានផ្សាយ",
  },
  returned: {
    en: "Returned for changes",
    km: "ត្រឡប់វិញសម្រាប់ការកែប្រែ",
  },
};

// statusLabel("pending", "km") -> "កំពុងរង់ចាំការពិនិត្យ"
export function statusLabel(status, lang = "en") {
  return STATUS_LABELS[status]?.[lang] ?? null;
}