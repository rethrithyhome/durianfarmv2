// Supabase Edge Function: send-push
//
// Sends a Web Push notification to every device a given user (or every
// device on a farm) has subscribed from. Called two ways:
//   1. Automatically by the notify_task_assigned() Postgres trigger via
//      pg_net, whenever a task is assigned to someone.
//   2. Directly from the app (supabase.functions.invoke) for anything
//      else you want to notify about later (payroll due, debt reminder,
//      etc) — just pass { userId, title, body, url }.
//
// Uses the VAPID keys below to sign push messages per the Web Push
// protocol (RFC 8291). Requires the SUPABASE_SERVICE_ROLE_KEY (to read
// subscriptions, bypassing RLS) plus VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
// set as function secrets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

webpush.setVapidDetails("mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { userId, farmId, title, body, url, tag } = await req.json();
    if (!title) return json({ error: "Missing title" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    let query = admin.from("push_subscriptions").select("endpoint, p256dh, auth");
    if (userId) query = query.eq("user_id", userId);
    else if (farmId) query = query.eq("farm_id", farmId);
    else return json({ error: "Provide userId or farmId" }, 400);

    const { data: subs, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({ title, body: body || "", url: url || "/", tag });
    const results = await Promise.allSettled(
      (subs ?? []).map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        ).catch(async (err) => {
          // A 410/404 means the subscription is dead (uninstalled, expired) — clean it up.
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return json({ ok: true, sent, total: subs?.length ?? 0 });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
