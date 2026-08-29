# Steady — Project Status

## What it is
Steady is a mobile app for AA/NA sponsors to track their sponsees' recovery progress. Sponsors have accounts; sponsees never sign up or download anything — they get a private link to a web page where they can see and check off what their sponsor has assigned them.

## Core decisions made so far
- Sponsor-only auth, via email one-time code (no passwords; magic-link email was tried first but the mobile-browser redirect back into the app proved unreliable, so it was replaced)
- Sponsees interact only through an unguessable per-sponsee link (the "check-in page") — no login of their own, ever
- iOS is on hold — requires a $99/year Apple Developer account that hasn't been set up
- No automated SMS reminders — sending the check-in link is a manual action through the sponsor's own phone (avoids the cost/setup of a texting service like Twilio)
- Donations: a low-pressure, visible "pass the basket"-style option is planned for closer to real launch, deliberately not built yet
- No GitHub remote yet — intentional, still in active build-and-test mode, local commits only

## Database (Supabase/Postgres)
- **sponsors** — one row per sponsor account. Email, push notification token.
- **sponsees** — belongs to one sponsor. Name, phone (optional), private notes, sobriety date (optional), current step, streak count, archived flag (soft-delete instead of hard delete — archived sponsees can be restored or permanently deleted later).
- **worksheets** — the shared step-work library (28 items seeded so far). Title, step/category, type (regular worksheet vs. daily check-in), purpose, list of prompts.
- **readings** — reference readings from AA/NA literature (13 seeded: Big Book, Twelve Steps and Twelve Traditions, Living Sober). Source book, chapter/section (no page numbers — those aren't stable across editions), a step/theme tag, and a short note for the sponsor on when to use it.
- **worksheet_readings** — many-to-many link between worksheets and readings (a reading can attach to more than one worksheet, and vice versa).
- **assignments** — one row per thing assigned to a sponsee, whether a worksheet or a reading. Status (pending/done/overdue), assigned date, due date. This is the central tracking table the whole app revolves around — a reading and a worksheet are tracked identically once assigned.
- **recurring_assignments** — marks a worksheet as "assign this same one every day" for a sponsee (e.g. a daily gratitude check-in); a scheduled job creates each day's fresh assignment automatically.

Current content snapshot: 28 worksheets, 13 readings, 26 worksheet-reading links, 2 active test sponsees, 3 live assignments.

## Screens

**Sponsor app (requires sign-in):**
- **Sign-in** — email + one-time code
- **Dashboard** — list of active sponsees, searchable and sortable by name/streak/overdue count; entry points to add a sponsee or view archived ones
- **Add / Edit Sponsee** — name, phone, sobriety date, current step, private notes; the edit screen is also where a sponsee gets archived
- **Sponsee Detail** — the full picture of one sponsee: streak/sobriety badge, private notes, the check-in link (copy or text it), any recurring worksheets, and the full assignment list with due-date editing and removal
- **Archived Sponsees** — restore or permanently delete
- **Library** — browse Worksheets or Readings via a tab toggle, with search and step/theme filtering; worksheets can be created/edited/deleted from here
- **Worksheet Detail** — full worksheet content, any attached readings shown inline, the assign-to-sponsee flow (with optional reading checkboxes), and a fill-in PDF export
- **Settings** — signed-in email, sign out, Appearance toggle (System/Light/Dark), full account deletion

**Sponsee-facing (no login, reached via a private link):**
- **Check-In page** — a greeting, streak/sobriety display, a progress bar, and a checklist of assigned worksheets and readings they can mark done themselves

## Features: built vs. stubbed vs. not started

**Built and working:**
- Sponsor auth, full sponsee management, archiving
- Worksheet library with full create/edit/delete, filtering by step and type
- Assignment lifecycle: assign, unassign, edit due date, overdue detection computed live (never stale), recurring daily assignments
- Reading references: library browsing, worksheet attachments, optional assignment alongside a worksheet, all using the same tracking as worksheets
- Push notifications: sponsor is notified when a sponsee completes something, and once when something first goes overdue
- Streak tracking and sobriety-date milestones, shown to both sponsor and sponsee
- Dark mode, both automatic (follows the phone) and a manual override
- Public check-in page, deployed and reachable from any device/network
- Manual "text the link" via the sponsor's own phone

**Stubbed / partial:**
- Readings have no add/edit/delete screen yet — new ones currently require adding them directly in the database
- No reading has its own detail page — they only ever show as inline cards (in the Library, on a worksheet, or on the check-in page)
- No dashboard-wide summary stats (e.g. total sponsees, completion rate across everyone) — considered, not built

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
- The check-in web page is a separately deployed artifact from the phone app itself and needs a manual rebuild-and-redeploy step whenever its code changes — this already caused one real bug (a completed feature that worked everywhere except the live check-in link, until redeployed)
