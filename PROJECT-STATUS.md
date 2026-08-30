# Steady — Project Status

## What it is
Steady is a mobile app for AA/NA sponsors to track their sponsees' recovery progress. Sponsors have accounts; sponsees never sign up or download anything — they get a private link to a web page where they can see and check off what their sponsor has assigned them.

## Core decisions made so far
- Sponsor-only auth, via email one-time code (no passwords; magic-link email was tried first but the mobile-browser redirect back into the app proved unreliable, so it was replaced)
- Sponsees interact only through an unguessable per-sponsee link (the "check-in page") — no login of their own, ever
- iOS is on hold — requires a $99/year Apple Developer account that hasn't been set up
- No automated SMS reminders — sending the check-in link is a manual action through the sponsor's own phone (avoids the cost/setup of a texting service like Twilio)
- Donations: a low-pressure, visible "pass the basket"-style option is planned for closer to real launch, deliberately not built yet
- Code now lives on GitHub (private repo) as a backup/remote, after a period of intentionally staying local-only during heavy build-and-test iteration
- **EAS Update is set up and confirmed working**: JS-only changes (new screens, logic, styling, content, bug fixes) ship instantly to the installed standalone build via `eas update` — just close and reopen the app, no rebuild or reinstall. Only changes touching native code (new native libraries, permissions, icon/splash, native config) still need a full rebuild. Every change going forward is explicitly labeled with which path it needs.
- The FAQ content (below) is a first draft that still needs review from a sponsor with real program time before it's shown to an actual sponsor — flagged by design, not yet done.

## Database (Supabase/Postgres)
- **sponsors** — one row per sponsor account. Email, push notification token, whether they've dismissed the dashboard FAQ prompt.
- **sponsees** — belongs to one sponsor. Name, phone (optional), private notes, sobriety date (optional), current step, streak count, archived flag (soft-delete instead of hard delete — archived sponsees can be restored or permanently deleted later).
- **worksheets** — the shared step-work library (28 items). Title, step/category, type (regular worksheet vs. daily check-in), purpose, list of prompts.
- **readings** — reference readings from AA/NA literature (18 seeded: Big Book, Twelve Steps and Twelve Traditions, Living Sober). Source book, chapter/section (no page numbers — those aren't stable across editions), a step/theme tag, and an optional short note for the sponsor on when to use it.
- **worksheet_readings** — many-to-many link between worksheets and readings. Every worksheet currently has at least one linked reading, and every reading is linked to at least one worksheet.
- **faq_items** — first-time-sponsor Q&A content (10 seeded), independent of steps/worksheets. Question, answer, and a sort_order for display control. Each row is individually addressable by id, so a future feature could deep-link to a specific answer without a schema change.
- **assignments** — one row per thing assigned to a sponsee, whether a worksheet or a reading. Status (pending/done/overdue), assigned date, due date. This is the central tracking table the whole app revolves around — a reading and a worksheet are tracked identically once assigned.
- **recurring_assignments** — marks a worksheet as "assign this same one every day" for a sponsee (e.g. a daily gratitude check-in); a scheduled job creates each day's fresh assignment automatically.

Current content snapshot: 28 worksheets, 18 readings, 33 worksheet-reading links, 10 FAQ items, 2 active test sponsees, 7 live assignments.

## Screens

**Sponsor app (requires sign-in):**
- **Sign-in** — email + one-time code
- **Dashboard** — list of active sponsees, searchable and sortable by name/streak/overdue count; a dismissible banner nudging sponsors with fewer than 3 active sponsees toward the FAQ tab; entry points to add a sponsee or view archived ones
- **Add / Edit Sponsee** — name, phone, sobriety date, current step, private notes; the edit screen is also where a sponsee gets archived
- **Sponsee Detail** — the full picture of one sponsee: streak/sobriety badge, private notes, the check-in link (copy or text it), any recurring worksheets, and the full assignment list (worksheets and readings together) with due-date editing and removal
- **Archived Sponsees** — restore or permanently delete
- **Library** — browse Worksheets or Readings via a tab toggle, with search and step/theme filtering; both content types can be created/edited/deleted from here
- **Worksheet Detail** — full worksheet content, any attached readings shown inline, the assign-to-sponsee flow (with optional reading checkboxes), and a fill-in PDF export
- **Add / Edit Reading** — chapter/section, source (with autocomplete from existing sources), step/theme, an optional sponsor note, and a checkbox list to manage which worksheets it's attached to; deleting a reading is blocked (not just warned) while any sponsee still has it pending or overdue
- **FAQ** — expandable question list (tap to reveal the answer) with text search across questions and answers; no add/edit/delete screen yet, content is seeded directly
- **Settings** — signed-in email, sign out, Appearance toggle (System/Light/Dark), full account deletion

**Sponsee-facing (no login, reached via a private link):**
- **Check-In page** — a greeting, streak/sobriety display, a progress bar, and a checklist of assigned worksheets and readings they can mark done themselves

## Features: built vs. stubbed vs. not started

**Built and working:**
- Sponsor auth, full sponsee management, archiving
- Worksheet library with full create/edit/delete, filtering by step and type
- Reading library with full create/edit/delete, source autocomplete, worksheet-attachment management from either side, and a stricter delete guard than worksheets (blocks entirely rather than just warning, if a sponsee has it active)
- Sponsor FAQ: first-time-sponsor Q&A content, its own nav tab with search, and a dismissible dashboard prompt for sponsors with few sponsees
- Assignment lifecycle: assign, unassign, edit due date, overdue detection computed live (never stale), recurring daily assignments
- Push notifications: sponsor is notified when a sponsee completes something, and once when something first goes overdue
- Streak tracking and sobriety-date milestones, shown to both sponsor and sponsee
- Dark mode, both automatic (follows the phone) and a manual override
- Public check-in page, deployed and reachable from any device/network
- Manual "text the link" via the sponsor's own phone
- Standalone (non-dev-client) builds, confirmed working fully offline from this computer/Wi-Fi — auth, data, and push notifications all verified over cellular data alone
- Over-the-air updates (EAS Update) for JS-only changes — confirmed working end-to-end, no rebuild needed for most future changes

**Stubbed / partial:**
- FAQ items have no add/edit/delete screen — new ones currently require adding them directly in the database (same starting point readings were at before their CRUD screen was built)
- No dashboard-wide summary stats (e.g. total sponsees, completion rate across everyone) — considered, not built
- No contextual FAQ resurfacing (e.g. automatically surfacing the relevant answer after a sponsee's first missed check-in) — explicitly deferred, but the schema (each FAQ item individually addressable) was kept ready for it

**Not started:**
- iOS build
- Donations / support-the-app feature
- Automated SMS reminders (currently fully manual)
- Any sponsor-to-sponsor or community feature
- Any sponsee-side notifications (sponsees have no app to notify — a deliberate boundary of the product, not a gap)

## Notable decisions worth keeping in mind
- Overdue status is always computed live rather than flipped by a nightly job, so it's never stale by up to a day
- Sponsee-side data access is locked down tightly: the check-in page never talks to raw tables, only two narrow server-side functions built specifically for it
- Reading assignments deliberately reuse the exact same assignment/status/due-date system as worksheets rather than being a separate parallel feature — so anything built for worksheets (due dates, overdue pushes, streak credit) works for readings for free
- The check-in web page is a separately deployed artifact from the phone app itself and needs a manual rebuild-and-redeploy step whenever its code changes
- Cloud builds (`eas build`) don't read the local `.env` file the way local development does — this caused a real crash-on-launch bug in the first standalone build until the same values were registered as proper EAS environment variables
- EAS Update's `runtimeVersion` uses the `appVersion` policy (not the more "automatic" `fingerprint` policy) — fingerprint computed differently between this Windows machine and EAS's cloud build servers and silently broke the first update push; appVersion is fully deterministic at the cost of needing a manual version bump whenever a future change touches native code
