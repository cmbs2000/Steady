-- Steady: sponsor + sponsee schema with row-level security.
-- Run this once in the Supabase Dashboard: SQL Editor > New query > paste > Run.

-- ─── sponsors ────────────────────────────────────────────────────────────
-- One row per authenticated sponsor, keyed 1:1 to their auth.users id.
create table public.sponsors (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

create policy "Sponsors can view their own row"
  on public.sponsors for select
  using (auth.uid() = id);

create policy "Sponsors can update their own row"
  on public.sponsors for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a sponsors row whenever someone signs up / signs in for the
-- first time via magic link, so the app never has to do this itself.
create function public.handle_new_sponsor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.sponsors (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_sponsor();

-- SECURITY DEFINER functions in public are directly callable via RPC by
-- default (Postgres grants EXECUTE to PUBLIC), which would let any signed-in
-- user invoke this and insert arbitrary sponsors rows. It only needs to run
-- as the trigger, so strip the RPC-callable grant.
revoke execute on function public.handle_new_sponsor() from public, anon, authenticated;

-- ─── sponsees ────────────────────────────────────────────────────────────
-- Belong to exactly one sponsor. Sponsees never sign in themselves, so
-- there's no auth user or password here at all.
create table public.sponsees (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  name text not null,
  phone text,
  current_step text not null default 'Step 1',
  streak_days integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now()
);

create index sponsees_sponsor_id_idx on public.sponsees (sponsor_id);

alter table public.sponsees enable row level security;

create policy "Sponsors can view their own sponsees"
  on public.sponsees for select
  using (auth.uid() = sponsor_id);

create policy "Sponsors can add their own sponsees"
  on public.sponsees for insert
  with check (auth.uid() = sponsor_id);

create policy "Sponsors can update their own sponsees"
  on public.sponsees for update
  using (auth.uid() = sponsor_id)
  with check (auth.uid() = sponsor_id);

create policy "Sponsors can delete their own sponsees"
  on public.sponsees for delete
  using (auth.uid() = sponsor_id);

-- ─── worksheets ──────────────────────────────────────────────────────────
-- Shared library content, not owned by any one sponsor. Readable by any
-- signed-in sponsor; managed centrally for now (no client write policies).
create table public.worksheets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  step text not null,
  type text not null default 'worksheet' check (type in ('worksheet', 'check-in', 'reading')),
  purpose text not null,
  prompts text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.worksheets enable row level security;

create policy "Signed-in sponsors can view the worksheet library"
  on public.worksheets for select
  to authenticated
  using (true);

-- The library is shared across every sponsor account (there's no
-- per-sponsor ownership column), so any signed-in sponsor can manage any
-- entry — same tradeoff as a shared, editable wiki. Deleting a worksheet
-- cascades to any assignments referencing it, sponsor-wide.
create policy "Signed-in sponsors can add worksheets"
  on public.worksheets for insert
  to authenticated
  with check (true);

create policy "Signed-in sponsors can update worksheets"
  on public.worksheets for update
  to authenticated
  using (true)
  with check (true);

create policy "Signed-in sponsors can delete worksheets"
  on public.worksheets for delete
  to authenticated
  using (true);

-- ─── assignments ─────────────────────────────────────────────────────────
-- Links a sponsee to a worksheet. Ownership flows through the sponsee, so
-- policies check that the sponsee belongs to the requesting sponsor.
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  sponsee_id uuid not null references public.sponsees (id) on delete cascade,
  worksheet_id uuid not null references public.worksheets (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'done', 'overdue')),
  assigned_date date not null default current_date,
  due_date date,
  created_at timestamptz not null default now()
);

create index assignments_sponsee_id_idx on public.assignments (sponsee_id);
create index assignments_worksheet_id_idx on public.assignments (worksheet_id);

alter table public.assignments enable row level security;

create policy "Sponsors can view assignments for their own sponsees"
  on public.assignments for select
  using (
    exists (
      select 1 from public.sponsees
      where sponsees.id = assignments.sponsee_id
        and sponsees.sponsor_id = auth.uid()
    )
  );

create policy "Sponsors can create assignments for their own sponsees"
  on public.assignments for insert
  with check (
    exists (
      select 1 from public.sponsees
      where sponsees.id = assignments.sponsee_id
        and sponsees.sponsor_id = auth.uid()
    )
  );

create policy "Sponsors can update assignments for their own sponsees"
  on public.assignments for update
  using (
    exists (
      select 1 from public.sponsees
      where sponsees.id = assignments.sponsee_id
        and sponsees.sponsor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sponsees
      where sponsees.id = assignments.sponsee_id
        and sponsees.sponsor_id = auth.uid()
    )
  );

create policy "Sponsors can delete assignments for their own sponsees"
  on public.assignments for delete
  using (
    exists (
      select 1 from public.sponsees
      where sponsees.id = assignments.sponsee_id
        and sponsees.sponsor_id = auth.uid()
    )
  );

-- ─── sponsee check-in (anonymous access) ────────────────────────────────
-- Sponsees reach their check-in page through an unguessable link containing
-- only their sponsee id — no auth.uid() exists for them. These two
-- SECURITY DEFINER functions are the ONLY way that anonymous request can
-- touch the database: each re-verifies the sponsee/assignment id match
-- itself before doing anything, so direct table access stays locked to
-- sponsors via RLS while this narrow path stays safe for anon.
create function public.checkin_get_sponsee(p_sponsee_id uuid)
returns table (
  id uuid,
  name text,
  assignment_id uuid,
  status text,
  due_date date,
  worksheet_id uuid,
  worksheet_title text,
  worksheet_step text,
  worksheet_purpose text,
  worksheet_prompts text[]
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
    select s.id, s.name, a.id, a.status, a.due_date, w.id, w.title, w.step, w.purpose, w.prompts
    from public.sponsees s
    left join public.assignments a on a.sponsee_id = s.id
    left join public.worksheets w on w.id = a.worksheet_id
    where s.id = p_sponsee_id;
end;
$$;

create function public.checkin_set_assignment_status(p_sponsee_id uuid, p_assignment_id uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_last_activity date;
begin
  if p_status not in ('pending', 'done', 'overdue') then
    raise exception 'invalid status';
  end if;

  update public.assignments
  set status = p_status
  where id = p_assignment_id and sponsee_id = p_sponsee_id;

  if not found then
    raise exception 'assignment not found for this sponsee';
  end if;

  if p_status = 'done' then
    select last_activity_date into v_last_activity from public.sponsees where id = p_sponsee_id;

    update public.sponsees
    set
      streak_days = case
        when v_last_activity is null or v_last_activity < current_date - 1 then 1
        when v_last_activity = current_date - 1 then streak_days + 1
        else streak_days
      end,
      last_activity_date = current_date
    where id = p_sponsee_id;
  end if;
end;
$$;

revoke execute on function public.checkin_get_sponsee(uuid) from public;
revoke execute on function public.checkin_set_assignment_status(uuid, uuid, text) from public;
grant execute on function public.checkin_get_sponsee(uuid) to anon, authenticated;
grant execute on function public.checkin_set_assignment_status(uuid, uuid, text) to anon, authenticated;
