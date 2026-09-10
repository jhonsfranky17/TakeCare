import type { TimeOfDay } from "../lib/format";

export const TIME_FILTER_OPTIONS = ["All", "Morning", "Afternoon", "Night"] as const;
export type TimeFilterLabel = (typeof TIME_FILTER_OPTIONS)[number];

export function timeFilterMatches(bucket: TimeOfDay, filter: TimeFilterLabel): boolean {
  if (filter === "All") return true;
  return bucket === (filter.toLowerCase() as TimeOfDay);
}

interface TimeFilterBarProps {
  value: TimeFilterLabel;
  onChange: (value: TimeFilterLabel) => void;
}

/** All/Morning/Afternoon/Night pills -- same visual pattern as History's
 * range filter, shared here since Home and Medicines both filter by the
 * same three time-of-day buckets and should stay visually identical. */
export function TimeFilterBar({ value, onChange }: TimeFilterBarProps): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TIME_FILTER_OPTIONS.map((f) => {
        const on = f === value;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--tc-font)",
              padding: "9px 15px",
              borderRadius: "var(--tc-r-badge)",
              background: on ? "var(--lima-950)" : "var(--tc-pill)",
              color: on ? "var(--lima-100)" : "var(--tc-ink-muted)",
              fontSize: 13.5,
              fontWeight: on ? 600 : 500,
            }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
