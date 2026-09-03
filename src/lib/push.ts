import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/** Requests permission (if needed), subscribes via the Push API, and
 * saves the subscription so the send-push Edge Function can find it
 * later. Safe to call again — upserts on (farm_id, endpoint). */
export async function enablePush(): Promise<void> {
  if (!pushSupported()) throw new Error("ឧបករណ៍នេះមិនគាំទ្រការជូនដំណឹងទេ");
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
  if (!vapidKey) throw new Error("កម្មវិធីមិនទាន់កំណត់រចនាសម្ព័ន្ធការជូនដំណឹងទេ");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("សូមអនុញ្ញាតការជូនដំណឹងក្នុង browser");

  const registration = await navigator.serviceWorker.ready;
  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const json = sub.toJSON();
  const res = await supabase.from("push_subscriptions").upsert(
    {
      farm_id: DEFAULT_FARM_ID,
      user_id: user?.id ?? null,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
    { onConflict: "endpoint" }
  );
  if (res.error) throw res.error;
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}
