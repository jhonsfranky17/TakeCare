import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { sendPushToPatientFamily } from "../_shared/push.ts";
import type { IntakeLog, Medicine, Patient } from "../_shared/types.ts";

type LogIntakeAction = "taken" | "undo";

interface LogIntakeRequest {
  intakeLogId: string;
  action?: LogIntakeAction;
}

function isLogIntakeRequest(value: unknown): value is LogIntakeRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.intakeLogId === "string" &&
    (record.action === undefined || record.action === "taken" || record.action === "undo")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: unknown = await req.json();
    if (!isLogIntakeRequest(body)) {
      return new Response(
        JSON.stringify({ error: "Expected { intakeLogId: string, action?: 'taken' | 'undo' }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const action: LogIntakeAction = body.action ?? "taken";

    const admin = createAdminClient();

    const { data: log, error: logError } = await admin
      .from("intake_logs")
      .select("id, medicine_id, scheduled_time, taken_time, status, created_at")
      .eq("id", body.intakeLogId)
      .single();

    if (logError || !log) {
      return new Response(JSON.stringify({ error: "intake log not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const intakeLog = log as IntakeLog;

    const { data: medicineRow, error: medicineError } = await admin
      .from("medicines")
      .select(
        "id, patient_id, name, dosage_per_intake, times_per_day, current_stock, refill_threshold_days, low_stock_alert_sent_at, created_at"
      )
      .eq("id", intakeLog.medicine_id)
      .single();

    if (medicineError || !medicineRow) {
      throw medicineError ?? new Error("medicine not found");
    }
    const medicine = medicineRow as Medicine;

    if (action === "undo") {
      if (intakeLog.status !== "taken") {
        return new Response(JSON.stringify({ error: "only a taken dose can be undone" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: undoLogError } = await admin
        .from("intake_logs")
        .update({ status: "pending", taken_time: null })
        .eq("id", intakeLog.id);
      if (undoLogError) {
        throw undoLogError;
      }

      const { error: undoStockError } = await admin
        .from("medicines")
        .update({ current_stock: medicine.current_stock + medicine.dosage_per_intake })
        .eq("id", medicine.id);
      if (undoStockError) {
        throw undoStockError;
      }

      // Undo is a quiet correction, not an event worth notifying the family about.
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();

    const { error: updateLogError } = await admin
      .from("intake_logs")
      .update({ status: "taken", taken_time: nowIso })
      .eq("id", intakeLog.id);

    if (updateLogError) {
      throw updateLogError;
    }

    const { error: stockError } = await admin
      .from("medicines")
      .update({ current_stock: medicine.current_stock - medicine.dosage_per_intake })
      .eq("id", medicine.id);

    if (stockError) {
      throw stockError;
    }

    const { data: patientRow, error: patientError } = await admin
      .from("patients")
      .select("id, name, timezone")
      .eq("id", medicine.patient_id)
      .single();

    if (patientError || !patientRow) {
      throw patientError ?? new Error("patient not found");
    }
    const patient = patientRow as Patient;

    const doseTime = new Date(intakeLog.scheduled_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: patient.timezone,
    });

    await sendPushToPatientFamily(admin, patient.id, {
      title: "Dose taken",
      body: `${patient.name} took their ${doseTime} dose of ${medicine.name}`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("log-intake error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
