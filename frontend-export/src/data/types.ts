export type DoseStatus = 'pending' | 'taken' | 'missed';

export interface Dose {
  id: string;
  medicineName: string;
  dosage: string;          // "75 mg"
  scheduledTime: string;   // "9:00 PM"
  status: DoseStatus;
  takenAt: string | null;  // "8:12 AM"
}

export interface HistoryRow {
  id: string;
  name: string;
  detail: string;          // "Scheduled 10:00 PM"
  status: string;          // "Taken 10:04 PM" | "Missed"
  taken: boolean;
}

export interface HistoryDay {
  id: string;
  label: string;           // "Yesterday · 7 Sep"
  summary: string;         // "5 of 5 taken"
  rows: HistoryRow[];
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  schedule: string;        // "8:00 AM and 8:00 PM"
  stockCount: number;
  stockCapacity: number;
  runsOut: string;         // "runs out Friday"
  low: boolean;
}

export type NotifyPreference = 'all' | 'missed';

export interface FamilyMember {
  id: string;
  name: string;
  initials: string;
  relation: string;
  notify: NotifyPreference;
}

export type ScreenName = 'login' | 'home' | 'history' | 'medicines' | 'family';
