// Supabase Edge Function: create-user
// Lets the farm OWNER create logins for workers/managers/etc directly,
// with the email already marked confirmed — so that person can log in
// immediately with the email + password the owner set for them, with no
// "check your email and click the link" step on their side.
//
// This must run server-side because it uses the service_role key, which
// has full admin rights and must never be shipped to the browser. The
// function itself re-checks (server-side) that the caller is really an
// owner before creating anything — it does not trust the frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Bound to the CALLER's own session — used only to find out who is calling.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: "សម័យចូលប្រើមិនត្រឹមត្រូវ សូម Sign in ម្តងទៀត" }, 401);

    // Full-privilege client — only ever used server-side, never sent to the browser.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profErr } = await admin
      .from("profiles").select("role, farm_id").eq("id", caller.id).single();
    if (profErr || !callerProfile || callerProfile.role !== "owner" || !callerProfile.farm_id) {
      return json({ error: "តែម្ចាស់ចម្ការប៉ុណ្ណោះទើបបង្កើតអ្នកប្រើប្រាស់ថ្មីបាន" }, 403);
    }

    const { email, password, name, role, plots } = await req.json();
    if (!email || !password || !name || !role) return json({ error: "ខ្វះព័ត៌មានចាំបាច់" }, 400);
    if (password.length < 6) return json({ error: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ" }, 400);
    const allowedRoles = ["general_manager", "team_lead", "skilled_worker", "sales"];
    if (!allowedRoles.includes(role)) return json({ error: "តួនាទីមិនត្រឹមត្រូវ" }, 400);

    // email_confirm: true is the key part — this is what skips the
    // "verify your email" step entirely for the new person.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    // The DB trigger already inserted a bare profile row for this new
    // auth user — fill in the real details and attach them to this farm.
    const { error: updateErr } = await admin.from("profiles").update({
      name, role, plots: plots || [], farm_id: callerProfile.farm_id, status: "active",
    }).eq("id", created.user.id);
    if (updateErr) return json({ error: updateErr.message }, 400);

    return json({ ok: true, id: created.user.id, email, name, role, plots: plots || [] });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
