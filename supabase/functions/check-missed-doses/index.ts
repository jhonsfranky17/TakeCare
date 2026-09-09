import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { sendPushToPatientFamily } from "../_shared/push.ts";
import type { IntakeLog, Medicine, Patient } from "../_shared/types.ts";

const GRACE_PERIOD_MINUTES = 15;

interface PendingDose extends IntakeLog {
  medicine: Medicine & { patient: Patient };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createAdminClient();

    const cutoff = new Date(
      Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000
    ).toISOString();

    const { data, error } = await admin
      .from("intake_logs")
      .select(
        `id, medicine_id, scheduled_time, taken_time, status, created_at,
         medicine:medicines (
           id, patient_id, name, dosage_per_intake, times_per_day, current_stock,
           refill_threshold_days, low_stock_alert_sent_at, created_at,
           patient:patients ( id, name, timezone )
         )`
      )
      .eq("status", "pending")
      .lt("scheduled_time", cutoff);

    if (error) {
      throw error;
    }

    const pendingDoses = (data ?? []) as unknown as PendingDose[];

    for (const dose of pendingDoses) {
      const { error: updateError } = await admin
        .from("intake_logs")
        .update({ status: "missed" })
        .eq("id", dose.id);

      if (updateError) {
        console.error(`failed to mark dose ${dose.id} missed:`, updateError);
        continue;
      }

      const patient = dose.medicine.patient;
      const doseTime = new Date(dose.scheduled_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: patient.timezone,
      });

      await sendPushToPatientFamily(admin, patient.id, {
        title: "Missed dose",
        body: `${patient.name} missed their ${doseTime} dose of ${dose.medicine.name} — please check in`,
      });
    }

    return new Response(JSON.stringify({ ok: true, processed: pendingDoses.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("check-missed-doses error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
