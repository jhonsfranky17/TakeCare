import webpush from "https://esm.sh/web-push@3.6.7";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { PushPayload, PushSubscriptionRow } from "./types.ts";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY secrets");
  }

  webpush.setVapidDetails("mailto:admin@takecare.app", publicKey, privateKey);
  configured = true;
}

// Sends `payload` to every family member linked to `patientId`. Stale
// subscriptions (410 Gone / 404 Not Found) are removed as they're found.
export async function sendPushToPatientFamily(
  admin: SupabaseClient,
  patientId: string,
  payload: PushPayload
): Promise<void> {
  ensureConfigured();

  const { data: members, error: membersError } = await admin
    .from("family_members")
    .select("id")
    .eq("patient_id", patientId);

  if (membersError) {
    throw membersError;
  }

  const memberIds = (members ?? []).map((m: { id: string }) => m.id);
  if (memberIds.length === 0) {
    return;
  }

  const { data: subscriptions, error: subsError } = await admin
    .from("push_subscriptions")
    .select("id, family_member_id, endpoint, p256dh, auth, created_at")
    .in("family_member_id", memberIds);

  if (subsError) {
    throw subsError;
  }

  const rows = (subscriptions ?? []) as PushSubscriptionRow[];
  const body = JSON.stringify(payload);

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body
        );
      } catch (err: unknown) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode: unknown }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id);
        } else {
          console.error(`push failed for subscription ${row.id}:`, err);
        }
      }
    })
  );
}
