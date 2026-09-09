export type IntakeStatus = "pending" | "taken" | "missed";

export interface Patient {
  id: string;
  name: string;
  timezone: string;
}

export interface Medicine {
  id: string;
  patient_id: string;
  name: string;
  dosage_per_intake: number;
  times_per_day: string[];
  current_stock: number;
  refill_threshold_days: number;
  low_stock_alert_sent_at: string | null;
  created_at: string;
}

export interface IntakeLog {
  id: string;
  medicine_id: string;
  scheduled_time: string;
  taken_time: string | null;
  status: IntakeStatus;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  family_member_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}
