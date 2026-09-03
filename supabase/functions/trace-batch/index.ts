// Supabase Edge Function: trace-batch
// Public, unauthenticated endpoint — anyone who scans a batch QR code
// can call this with just the batch code and see where their durian
// came from. Runs with the service role key so it can read across farm
// data despite the caller having no session, but it deliberately
// returns only a curated, safe subset of fields: no prices, no
// customer info, no expenses, no worker names — just farm name/logo,
// which trees the batch came from, and their care history.

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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return json({ error: "Missing batch code" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: batch, error: batchErr } = await admin
      .from("harvest_batches")
      .select("id, batch_code, packed_date, destination, farm_id")
      .eq("batch_code", code)
      .single();
    if (batchErr || !batch) return json({ error: "រកមិនឃើញបាច់នេះទេ" }, 404);

    const { data: farm } = await admin
      .from("farms").select("name, logo_url").eq("id", batch.farm_id).single();

    const { data: links } = await admin
      .from("batch_yield_events").select("yield_event_id").eq("batch_id", batch.id);
    const eventIds = (links ?? []).map((l) => l.yield_event_id);
    if (eventIds.length === 0) {
      return json({
        farmName: farm?.name ?? "", farmLogo: farm?.logo_url ?? null,
        batchCode: batch.batch_code, packedDate: batch.packed_date, destination: batch.destination, trees: [],
      });
    }

    const { data: events } = await admin
      .from("yield_events")
      .select("id, tree_id, cycle_id, date, quantity, weight_kg")
      .in("id", eventIds);

    const treeIds = [...new Set((events ?? []).map((e) => e.tree_id))];
    const cycleIds = [...new Set((events ?? []).map((e) => e.cycle_id).filter(Boolean))];

    const { data: trees } = await admin.from("trees").select("id, code, plot, variety").in("id", treeIds);
    const { data: cycles } = await admin.from("yield_cycles").select("id, flower_date").in("id", cycleIds);

    const treesById = new Map((trees ?? []).map((t) => [t.id, t]));
    const cyclesById = new Map((cycles ?? []).map((c) => [c.id, c]));

    // Care logs for each tree, scoped to that crop's growing period
    // (from flowering through the harvest date) — not the tree's whole
    // history, so it reflects care for *this* fruit specifically.
    const treeInfos = [];
    for (const e of events ?? []) {
      const tree = treesById.get(e.tree_id);
      if (!tree) continue;
      const cycle = e.cycle_id ? cyclesById.get(e.cycle_id) : null;
      const flowerDate = cycle?.flower_date ?? null;

      let careQuery = admin.from("care_logs").select("date, type, note").eq("tree_id", e.tree_id).lte("date", e.date);
      if (flowerDate) careQuery = careQuery.gte("date", flowerDate);
      const { data: careLogs } = await careQuery.order("date", { ascending: true });

      treeInfos.push({
        treeCode: tree.code, plot: tree.plot, variety: tree.variety,
        harvestDate: e.date, quantity: e.quantity, weightKg: e.weight_kg,
        careLogs: (careLogs ?? []).map((c) => ({ date: c.date, type: c.type, note: c.note })),
      });
    }

    return json({
      farmName: farm?.name ?? "", farmLogo: farm?.logo_url ?? null,
      batchCode: batch.batch_code, packedDate: batch.packed_date, destination: batch.destination,
      trees: treeInfos,
    });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
