import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Called by the sponsee's (unauthenticated) check-in page right after it
// marks an assignment done, so the sponsor finds out without opening the
// app. Uses the service role key to read across the sponsee/sponsor tables
// regardless of caller identity -- the anon check-in flow has no RLS access
// to sponsors, so this function is the only bridge between the two.
//
// The check-in page runs in a mobile browser, so calls here are
// cross-origin: the browser sends an OPTIONS preflight before the real
// POST, which must get CORS headers back or the browser blocks the actual
// request entirely.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { sponsee_id, worksheet_title } = await req.json();
    if (!sponsee_id) {
      return new Response(JSON.stringify({ error: "sponsee_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sponsee } = await supabase
      .from("sponsees")
      .select("name, sponsor_id")
      .eq("id", sponsee_id)
      .maybeSingle();

    if (!sponsee) {
      return new Response(JSON.stringify({ error: "sponsee not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sponsor } = await supabase
      .from("sponsors")
      .select("push_token")
      .eq("id", sponsee.sponsor_id)
      .maybeSingle();

    if (!sponsor?.push_token) {
      return new Response(JSON.stringify({ skipped: true, reason: "no push token on file" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = {
      to: sponsor.push_token,
      sound: "default",
      title: `${sponsee.name} checked in`,
      body: worksheet_title ? `Completed: ${worksheet_title}` : "Marked a worksheet complete",
    };

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(message),
    });

    const pushResult = await pushResponse.json();
    return new Response(JSON.stringify({ sent: true, pushResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
