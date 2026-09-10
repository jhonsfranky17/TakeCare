import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { subscribeToPush } from "../lib/push";
import {
  formatDosage,
  formatTime,
  greeting,
  initialsOf,
  joinNames,
} from "../lib/format";
import { DoseCard } from "../ui/DoseCard";
import { Toast } from "../ui/Toast";
import { LoadingScreen } from "../components/LoadingScreen";
import type { DoseWithMedicine, Medicine } from "../lib/types";
import type { Dose } from "../ui/viewTypes";

interface RawDoseRow {
  id: string;
  medicine_id: string;
  scheduled_time: string;
  taken_time: string | null;
  status: DoseWithMedicine["status"];
  created_at: string;
  medicine: Medicine;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function toViewDose(dose: DoseWithMedicine): Dose {
  return {
    id: dose.id,
    medicineName: dose.medicine.name,
    dosage: formatDosage(dose.medicine.dosage_per_intake),
    scheduledTime: formatTime(dose.scheduled_time),
    status: dose.status,
    takenAt: dose.taken_time ? formatTime(dose.taken_time) : null,
    notes: dose.medicine.notes,
  };
}

function summaryLine(pending: number, missed: number): string {
  if (pending === 0) return "All done for today, the whole family can relax.";
  const head = pending === 1 ? "One more today" : `${pending} more today`;
  const tail = missed > 0 ? ` · ${missed} to catch up on` : "";
  return `${head}${tail}. You are doing great.`;
}

export function Home(): JSX.Element {
  const { familyMember } = useAuth();
  const [doses, setDoses] = useState<DoseWithMedicine[]>([]);
  const [otherNames, setOtherNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadDoses = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("intake_logs")
      .select(
        `id, medicine_id, scheduled_time, taken_time, status, created_at,
         medicine:medicines ( id, patient_id, name, dosage_per_intake, times_per_day, current_stock, refill_threshold_days, low_stock_alert_sent_at, notes, created_at )`,
      )
      .gte("scheduled_time", startOfTodayIso())
      .lte("scheduled_time", endOfTodayIso())
      .order("scheduled_time", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as RawDoseRow[];
    setDoses(rows.map((row) => ({ ...row, medicine: row.medicine })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDoses();
  }, [loadDoses]);

  useEffect(() => {
    if (!familyMember) return;
    supabase
      .from("family_members")
      .select("id, name")
      .neq("id", familyMember.id)
      // Someone who's been pre-added but hasn't opened the app yet can't
      // have a push subscription -- don't claim they were notified.
      .not("auth_user_id", "is", null)
      .then(({ data }) => setOtherNames((data ?? []).map((m) => m.name)));
  }, [familyMember]);

  useEffect(() => {
    if (!familyMember) return;
    subscribeToPush(familyMember.id)
      .then((result) => {
        if (result.status === "denied") {
          setPushStatus(
            "Notifications are off, enable them in your browser settings to get alerts.",
          );
        } else if (result.status === "unsupported") {
          setPushStatus("This browser doesn't support push notifications.");
        }
      })
      .catch((err: unknown) => {
        console.error("push subscription failed:", err);
      });
  }, [familyMember]);

  const handleMarkTaken = async (doseId: string): Promise<void> => {
    setMarkingId(doseId);
    const { error: invokeError } = await supabase.functions.invoke(
      "log-intake",
      {
        body: { intakeLogId: doseId, action: "taken" },
      },
    );
    setMarkingId(null);

    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    const names = joinNames(otherNames);
    setToast(names ? `Logged. ${names} just got the good news.` : "Logged.");
    await loadDoses();
  };

  const handleUndo = async (doseId: string): Promise<void> => {
    setToast(null);
    const { error: invokeError } = await supabase.functions.invoke(
      "log-intake",
      {
        body: { intakeLogId: doseId, action: "undo" },
      },
    );
    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    await loadDoses();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const taken = doses.filter((d) => d.status === "taken").length;
  const pending = doses.filter((d) => d.status === "pending").length;
  const missed = doses.filter((d) => d.status === "missed").length;
  const dateLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      style={{
        padding: "62px 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: "var(--tc-fs-title)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
          >
            {greeting()}
            {familyMember ? `, ${familyMember.name.split(" ")[0]}` : ""}
          </div>
          <div
            style={{
              fontSize: "var(--tc-fs-body)",
              fontWeight: 400,
              color: "var(--tc-ink-muted)",
            }}
          >
            {dateLabel}
          </div>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "var(--tc-pill)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--tc-ok-ink)",
            flex: "none",
          }}
        >
          {familyMember ? initialsOf(familyMember.name) : "?"}
        </div>
      </div>

      {pushStatus && (
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.45,
            color: "var(--tc-ink-muted)",
            background: "var(--tc-pill)",
            borderRadius: 16,
            padding: "13px 14px",
          }}
        >
          {pushStatus}
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.5,
            color: "var(--tc-warn-ink)",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "var(--tc-card)",
          border: "1px solid var(--tc-line)",
          borderRadius: "var(--tc-r-card)",
          padding: 18,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "var(--tc-shadow)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--tc-ok-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--tc-ok-ink)",
            flex: "none",
          }}
        >
          {taken}/{doses.length}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            minWidth: 0,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {taken} of {doses.length} doses logged today
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 400,
              color: "var(--tc-ink-muted)",
              lineHeight: 1.45,
            }}
          >
            {summaryLine(pending, missed)}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.9px",
          textTransform: "uppercase",
          color: "var(--tc-ink-muted)",
          marginTop: 4,
        }}
      >
        Today&rsquo;s doses
      </div>

      {doses.length === 0 ? (
        <div style={{ fontSize: 14.5, color: "var(--tc-ink-muted)" }}>
          No doses scheduled for today yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {doses.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={toViewDose(dose)}
              onMarkTaken={(id) => void handleMarkTaken(id)}
              onUndo={(id) => void handleUndo(id)}
            />
          ))}
        </div>
      )}

      {markingId && (
        <div style={{ fontSize: 13, color: "var(--tc-ink-muted)" }}>
          Saving…
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
