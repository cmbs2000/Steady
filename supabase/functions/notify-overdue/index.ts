import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Triggered once daily by a pg_cron job (via pg_net) rather than by any
// client. Finds assignments that are overdue and haven't been flagged yet,
// sends ONE batched push per affected sponsor (not one per item, to avoid
// spamming), then marks them notified so they're never re-sent -- this is
// meant to be a one-time "heads up" the moment something first goes
// overdue, not a recurring nag.
Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: overdue, error } = await supabase
    .from("assignments")
    .select("id, sponsee:sponsees(id, name, sponsor_id), worksheet:worksheets(title)")
    .eq("status", "pending")
    .is("overdue_notified_at", null)
    .lt("due_date", today);

  if (error || !overdue || overdue.length === 0) {
    return new Response(JSON.stringify({ processed: 0, error: error?.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  type Item = { sponseeId: string; sponseeName: string; worksheetTitle: string };
  const bySponsor = new Map<string, Item[]>();
  for (const row of overdue as any[]) {
    const sponsorId = row.sponsee?.sponsor_id;
    if (!sponsorId) continue;
    const items = bySponsor.get(sponsorId) ?? [];
    items.push({
      sponseeId: row.sponsee?.id,
      sponseeName: row.sponsee?.name ?? "A sponsee",
      worksheetTitle: row.worksheet?.title ?? "a worksheet",
    });
    bySponsor.set(sponsorId, items);
  }

  const { data: sponsors, error: sponsorsError } = await supabase
    .from("sponsors")
    .select("id, push_token")
    .in("id", Array.from(bySponsor.keys()));

  const messages: Record<string, unknown>[] = [];
  for (const sponsor of sponsors ?? []) {
    if (!sponsor.push_token) continue;
    const items = bySponsor.get(sponsor.id)!;
    const title = items.length === 1 ? "1 worksheet is overdue" : `${items.length} worksheets are overdue`;
    const body =
      items.length <= 3
        ? items.map((i) => `${i.sponseeName}: ${i.worksheetTitle}`).join("; ")
        : items
            .slice(0, 3)
            .map((i) => `${i.sponseeName}: ${i.worksheetTitle}`)
            .join("; ") + `, and ${items.length - 3} more`;

    // Only deep-link to a specific sponsee when the whole batch is about
    // just one of them -- otherwise there's no single right screen to open.
    const distinctSponseeIds = new Set(items.map((i) => i.sponseeId));
    const data = distinctSponseeIds.size === 1 ? { sponseeId: items[0].sponseeId } : undefined;

    messages.push({ to: sponsor.push_token, sound: "default", title, body, data });
  }

  let pushResult = null;
  if (messages.length > 0) {
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    pushResult = await pushResponse.json();
  }

  const allIds = (overdue as any[]).map((r) => r.id);
  await supabase.from("assignments").update({ overdue_notified_at: new Date().toISOString() }).in("id", allIds);

  return new Response(
    JSON.stringify({
      processed: allIds.length,
      notified: messages.length,
      messages,
      pushResult,
      sponsorsError: sponsorsError?.message,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
