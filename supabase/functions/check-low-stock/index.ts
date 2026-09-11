import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { sendPushToPatientFamily } from "../_shared/push.ts";
import type { Medicine, Patient } from "../_shared/types.ts";

interface MedicineWithPatient extends Medicine {
  patient: Patient;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.from("medicines").select(
      `id, patient_id, name, dosage_per_intake, times_per_day, current_stock,
       refill_threshold_days, low_stock_alert_sent_at, created_at,
       patient:patients ( id, name, timezone )`
    );

    if (error) {
      throw error;
    }

    const medicines = (data ?? []) as unknown as MedicineWithPatient[];
    let alertsSent = 0;

    for (const medicine of medicines) {
      const dailyDoses = medicine.dosage_per_intake * medicine.times_per_day.length;
      if (dailyDoses <= 0) {
        continue;
      }

      const daysRemaining = Math.floor(medicine.current_stock / dailyDoses);

      // Re-alert once per day (this function runs on a daily cron) for as
      // long as the medicine stays low, instead of only ever alerting once
      // -- a family can otherwise miss the single alert and never hear about
      // it again until it runs out entirely. The 20h floor (not 24h) guards
      // against a same-day re-invocation (cron drift, manual retry) causing
      // a duplicate alert, while still firing on the next day's run.
      const hoursSinceLastAlert = medicine.low_stock_alert_sent_at
        ? (Date.now() - new Date(medicine.low_stock_alert_sent_at).getTime()) / 3_600_000
        : Infinity;

      if (daysRemaining <= medicine.refill_threshold_days && hoursSinceLastAlert >= 20) {
        await sendPushToPatientFamily(admin, medicine.patient.id, {
          title: "Refill needed",
          body: `${medicine.name} will run out in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} — time to refill`,
        });

        const { error: updateError } = await admin
          .from("medicines")
          .update({ low_stock_alert_sent_at: new Date().toISOString() })
          .eq("id", medicine.id);

        if (updateError) {
          console.error(`failed to flag alert sent for ${medicine.id}:`, updateError);
        } else {
          alertsSent += 1;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, alertsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("check-low-stock error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
