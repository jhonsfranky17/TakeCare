export type IntakeStatus = "pending" | "taken" | "missed";

export type Patient = {
  id: string;
  name: string;
  timezone: string;
};

export type Medicine = {
  id: string;
  patient_id: string;
  name: string;
  dosage_per_intake: number;
  times_per_day: string[];
  current_stock: number;
  refill_threshold_days: number;
  low_stock_alert_sent_at: string | null;
  created_at: string;
};

export type IntakeLog = {
  id: string;
  medicine_id: string;
  scheduled_time: string;
  taken_time: string | null;
  status: IntakeStatus;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  patient_id: string;
  name: string;
  relationship: string | null;
  auth_user_id: string;
  created_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  family_member_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

// A dose joined with its medicine, as rendered on the Home screen.
export type DoseWithMedicine = IntakeLog & {
  medicine: Medicine;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id">;
        Update: Partial<Omit<Patient, "id">>;
        Relationships: Relationship[];
      };
      medicines: {
        Row: Medicine;
        Insert: Omit<Medicine, "id" | "created_at" | "low_stock_alert_sent_at"> & {
          low_stock_alert_sent_at?: string | null;
        };
        Update: Partial<Omit<Medicine, "id" | "created_at">>;
        Relationships: Relationship[];
      };
      intake_logs: {
        Row: IntakeLog;
        Insert: Omit<IntakeLog, "id" | "created_at" | "status" | "taken_time"> & {
          status?: IntakeStatus;
          taken_time?: string | null;
        };
        Update: Partial<Omit<IntakeLog, "id" | "created_at">>;
        Relationships: Relationship[];
      };
      family_members: {
        Row: FamilyMember;
        Insert: Omit<FamilyMember, "id" | "created_at" | "relationship"> & {
          relationship?: string | null;
        };
        Update: Partial<Omit<FamilyMember, "id" | "created_at">>;
        Relationships: Relationship[];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Omit<PushSubscriptionRow, "id" | "created_at">;
        Update: Partial<Omit<PushSubscriptionRow, "id" | "created_at">>;
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
