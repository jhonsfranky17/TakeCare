import { supabase } from "./supabaseClient";

// Converts the URL-safe base64 VAPID public key into the Uint8Array shape
// PushManager.subscribe expects for applicationServerKey.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushSubscribeResult =
  | { status: "subscribed" }
  | { status: "denied" }
  | { status: "unsupported" };

export async function subscribeToPush(
  familyMemberId: string
): Promise<PushSubscribeResult> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  const registration = await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY
      ),
    }));

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!p256dh || !auth) {
    throw new Error("Push subscription is missing encryption keys");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      family_member_id: familyMemberId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    throw error;
  }

  return { status: "subscribed" };
}

// Called on logout so a released family_members row doesn't keep pushing
// to the device that just gave it up -- removes both the DB row and the
// browser's own subscription (best-effort; a failure here shouldn't block
// the logout itself).
export async function unsubscribeFromPush(familyMemberId: string): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("family_member_id", familyMemberId);
  if (error) {
    console.error("failed to remove push subscription row:", error);
  }

  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    await existing?.unsubscribe();
  } catch (err: unknown) {
    console.error("failed to unsubscribe browser push manager:", err);
  }
}
