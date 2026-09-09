import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatTime } from "../lib/format";
import { CheckIcon, ClockIcon } from "../ui/icons";
import { LoadingScreen } from "../components/LoadingScreen";
import type { DoseWithMedicine, Medicine } from "../lib/types";
import type { HistoryDay } from "../ui/viewTypes";

interface RawDoseRow {
  id: string;
  medicine_id: string;
  scheduled_time: string;
  taken_time: string | null;
  status: DoseWithMedicine["status"];
  created_at: string;
  medicine: Medicine;
}

const RANGES = ["This week", "This month", "All"] as const;
type Range = (typeof RANGES)[number];

function ninetyDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - compare.getTime()) / 86_400_000);

  const dm = date.toLocaleDateString([], { day: "numeric", month: "short" });
  if (diffDays === 0) return `Today · ${dm}`;
  if (diffDays === 1) return `Yesterday · ${dm}`;
  if (diffDays > 1 && diffDays < 7) return `${date.toLocaleDateString([], { weekday: "long" })} · ${dm}`;
  return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

function withinRange(date: Date, range: Range): boolean {
  if (range === "All") return true;
  const now = new Date();
  if (range === "This week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return date >= monthAgo;
}

function groupByDay(doses: DoseWithMedicine[]): HistoryDay[] {
  const byDayKey = new Map<string, DoseWithMedicine[]>();
  for (const dose of doses) {
    const d = new Date(dose.scheduled_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = byDayKey.get(key);
    if (existing) {
      existing.push(dose);
    } else {
      byDayKey.set(key, [dose]);
    }
  }

  return Array.from(byDayKey.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, dayDoses]) => {
      const takenCount = dayDoses.filter((d) => d.status === "taken").length;
      const [first] = dayDoses;
      return {
        id: key,
        label: first ? dayLabel(new Date(first.scheduled_time)) : key,
        summary: `${takenCount} of ${dayDoses.length} taken`,
        rows: dayDoses.map((dose) => ({
          id: dose.id,
          name: dose.medicine.name,
          detail: `Scheduled ${formatTime(dose.scheduled_time)}`,
          status: dose.status === "taken" && dose.taken_time ? `Taken ${formatTime(dose.taken_time)}` : "Missed",
          taken: dose.status === "taken",
        })),
      };
    });
}

export function History(): JSX.Element {
  const [doses, setDoses] = useState<DoseWithMedicine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("This week");

  useEffect(() => {
    async function load(): Promise<void> {
      const { data, error: fetchError } = await supabase
        .from("intake_logs")
        .select(
          `id, medicine_id, scheduled_time, taken_time, status, created_at,
           medicine:medicines ( id, patient_id, name, dosage_per_intake, times_per_day, current_stock, refill_threshold_days, low_stock_alert_sent_at, created_at )`
        )
        .neq("status", "pending")
        .gte("scheduled_time", ninetyDaysAgoIso())
        .order("scheduled_time", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as RawDoseRow[];
      setDoses(rows.map((row) => ({ ...row, medicine: row.medicine })));
      setLoading(false);
    }
    void load();
  }, []);

  const filtered = useMemo(
    () => doses.filter((d) => withinRange(new Date(d.scheduled_time), range)),
    [doses, range]
  );
  const days = useMemo(() => groupByDay(filtered), [filtered]);

  const onTrackDays = days.filter((d) => d.rows.every((r) => r.taken)).length;
  const headline =
    days.length === 0
      ? "No history in this range yet."
      : `${onTrackDays} of the last ${days.length} days fully on track.`;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ padding: "62px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: "var(--tc-fs-title)", fontWeight: 700, letterSpacing: "-0.5px" }}>History</div>
        <div style={{ fontSize: "var(--tc-fs-body)", fontWeight: 400, color: "var(--tc-ink-muted)" }}>{headline}</div>
      </div>

      {error && <div style={{ fontSize: 13.5, color: "var(--tc-warn-ink)" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        {RANGES.map((r) => {
          const on = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
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
              {r}
            </button>
          );
        })}
      </div>

      {days.length === 0 ? (
        <div style={{ fontSize: 14.5, color: "var(--tc-ink-muted)" }}>No history in this range yet.</div>
      ) : (
        days.map((day) => (
          <div key={day.id} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{day.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tc-ink-muted)" }}>{day.summary}</div>
            </div>
            <div
              style={{
                background: "var(--tc-card)",
                border: "1px solid var(--tc-line)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "var(--tc-shadow)",
              }}
            >
              {day.rows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "15px 16px",
                    borderBottom: "1px solid var(--tc-line)",
                    minHeight: 56,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      flex: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: row.taken ? "var(--tc-ok-bg)" : "var(--tc-warn-bg)",
                      color: row.taken ? "var(--tc-ok-ink)" : "var(--tc-warn-ink)",
                    }}
                  >
                    {row.taken ? <CheckIcon size={17} /> : <ClockIcon size={17} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div
                      style={{
                        fontSize: 15.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "var(--tc-ink-muted)" }}>{row.detail}</div>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--tc-fs-badge)",
                      fontWeight: 600,
                      letterSpacing: "0.2px",
                      padding: "6px 10px",
                      borderRadius: "var(--tc-r-badge)",
                      flex: "none",
                      background: row.taken ? "var(--tc-ok-bg)" : "var(--tc-warn-bg)",
                      color: row.taken ? "var(--tc-ok-ink)" : "var(--tc-warn-ink)",
                    }}
                  >
                    {row.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
