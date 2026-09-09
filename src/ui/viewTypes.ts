// Display shapes consumed by the design's presentational components
// (src/ui/*, src/screens/*). Screens map real Supabase rows (src/lib/types.ts)
// into these before rendering — keeps the design components pixel-for-pixel
// as exported while all real-data mapping lives in one place per screen.

export type DoseStatus = "pending" | "taken" | "missed";

export type Dose = {
  id: string;
  medicineName: string;
  dosage: string; // "2 pill(s)"
  scheduledTime: string; // "9:00 PM"
  status: DoseStatus;
  takenAt: string | null; // "8:12 AM" | "just now"
};

export type HistoryRow = {
  id: string;
  name: string;
  detail: string; // "Scheduled 10:00 PM"
  status: string; // "Taken 10:04 PM" | "Missed"
  taken: boolean;
};

export type HistoryDay = {
  id: string;
  label: string; // "Yesterday · 7 Sep"
  summary: string; // "5 of 5 taken"
  rows: HistoryRow[];
};

export type ViewMedicine = {
  id: string;
  name: string;
  dosage: string;
  schedule: string; // "8:00 AM and 8:00 PM"
  stockCount: number;
  stockCapacity: number;
  runsOut: string; // "runs out Friday"
  low: boolean;
};

export type ViewFamilyMember = {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
  isSelf: boolean;
};
