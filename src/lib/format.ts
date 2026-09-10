// Shared display formatting for the design's screens — real data in, the
// exact copy/format the design expects out.

export function formatTime(iso: string): string {
  // hour12 explicit: the design always shows "8:00 AM"-style times, and
  // relies on that format elsewhere (StatusBadge strips ":00" off it) -- an
  // unforced toLocaleTimeString silently switches to 24h on locales that
  // default to it, breaking both the display and that string manipulation.
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDosage(dosagePerIntake: number): string {
  return `${dosagePerIntake} pill${dosagePerIntake === 1 ? "" : "s"}`;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// "Priya, Arjun and Meera" / "Priya and Arjun" / "Priya" / "" for empty.
export function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// "08:00" (24h, as stored) -> "8:00 AM" (as displayed).
export function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr ?? "00"} ${period}`;
}

// "8:00 AM" (as displayed) -> "08:00" (24h, for storage). Returns null if unparseable.
export function to24h(display: string): string | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(display.trim());
  if (!match) return null;
  const [, hStr, mStr, period] = match;
  let h = Number(hStr) % 12;
  if (period?.toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${mStr}`;
}

// Chronological order (8:00 AM before 9:00 PM), not the order they were
// picked/typed in -- used wherever a medicine's times are edited or shown,
// so the schedule always reads left-to-right through the day.
export function sortTimes12h(times12h: string[]): string[] {
  return [...times12h].sort((a, b) => (to24h(a) ?? "").localeCompare(to24h(b) ?? ""));
}

// Always sorts -- times_per_day can predate this sort existing (rows saved
// before the fix, or written directly via SQL), so display sorts
// defensively rather than trusting stored order to already be chronological.
export function joinTimes(times12h: string[]): string {
  return joinNames(sortTimes12h(times12h));
}

export function daysRemaining(currentStock: number, dosagePerIntake: number, timesPerDayCount: number): number {
  const dailyDoses = dosagePerIntake * timesPerDayCount;
  if (dailyDoses <= 0) return Infinity;
  return Math.floor(currentStock / dailyDoses);
}

export function runsOutLabel(days: number): string {
  if (days <= 0) return "out of stock";
  if (days === 1) return "runs out tomorrow";
  if (days < 7) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    return `runs out ${target.toLocaleDateString([], { weekday: "long" })}`;
  }
  if (days >= 25) return "about a month";
  return `about ${days} days`;
}

export type TimeOfDay = "morning" | "afternoon" | "night";

// Splits the day into three non-overlapping bands covering all 24 hours, so
// a time-of-day filter never hides something because its time fell in a
// gap. Shared by both time representations the app stores: ISO timestamps
// (intake_logs.scheduled_time) and stored "HH:MM" strings (medicines.times_per_day).
function bucketForHour(hour: number): TimeOfDay {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "night";
}

// Same local-time convention formatTime() already uses (no explicit
// timeZone -- relies on the viewing device's own clock).
export function timeOfDay(iso: string): TimeOfDay {
  return bucketForHour(new Date(iso).getHours());
}

// "08:00" (24h, as stored in medicines.times_per_day) -> its bucket.
export function timeOfDayFromHHMM(hhmm: string): TimeOfDay {
  return bucketForHour(Number(hhmm.split(":")[0]));
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}
