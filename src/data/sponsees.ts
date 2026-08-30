import { useCallback, useState } from 'react';

import { getEffectiveStatus } from '@/lib/assignmentStatus';
import { supabase } from '@/lib/supabase';

export interface DbSponsee {
  id: string;
  name: string;
  phone: string | null;
  sobriety_date: string | null;
  current_step: string;
  streak_days: number;
  archived_at: string | null;
  assignments: { status: 'pending' | 'done' | 'overdue' }[];
}

export interface DbSponseeDetail extends Omit<DbSponsee, 'assignments'> {
  notes: string | null;
  assignments: {
    id: string;
    status: 'pending' | 'done' | 'overdue';
    due_date: string | null;
    worksheet: { id: string; title: string; step: string } | null;
    reading: { id: string; source: string; chapter_or_section: string } | null;
  }[];
}

export function useSponsees(options: { archived?: boolean } = {}) {
  const { archived = false } = options;
  const [sponsees, setSponsees] = useState<DbSponsee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sponsees')
      .select('id, name, phone, sobriety_date, current_step, streak_days, archived_at, assignments(status, due_date)')
      .order('name');
    query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
    const { data, error } = await query;

    if (error) setError(error.message);
    else {
      setError(null);
      const withEffectiveStatus = (data ?? []).map((s) => ({
        ...s,
        assignments: s.assignments.map((a) => ({ status: getEffectiveStatus(a.status, a.due_date) })),
      }));
      setSponsees(withEffectiveStatus as DbSponsee[]);
    }
    setLoading(false);
  }, [archived]);

  return { sponsees, loading, error, refetch };
}

export function useSponsee(id: string | undefined) {
  const [sponsee, setSponsee] = useState<DbSponseeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsees')
      .select(
        'id, name, phone, notes, sobriety_date, current_step, streak_days, archived_at, assignments(id, status, due_date, worksheet:worksheets(id, title, step), reading:readings(id, source, chapter_or_section))'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) setError(error.message);
    else {
      setError(null);
      const withEffectiveStatus = data
        ? {
            ...data,
            assignments: data.assignments.map((a) => ({
              ...a,
              status: getEffectiveStatus(a.status, a.due_date),
            })),
          }
        : null;
      setSponsee(withEffectiveStatus as DbSponseeDetail | null);
    }
    setLoading(false);
  }, [id]);

  return { sponsee, loading, error, refetch };
}

export async function addSponsee({
  name,
  phone,
  sobrietyDate,
}: {
  name: string;
  phone: string | null;
  sobrietyDate: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('sponsees')
    .insert({ sponsor_id: user.id, name, phone, sobriety_date: sobrietyDate });
  if (error) throw error;
}

export interface SponseeInput {
  name: string;
  phone: string | null;
  current_step: string;
  notes?: string | null;
  sobriety_date?: string | null;
}

export async function updateSponsee(id: string, input: SponseeInput) {
  const { error } = await supabase.from('sponsees').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteSponsee(id: string) {
  const { error } = await supabase.from('sponsees').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveSponsee(id: string) {
  const { error } = await supabase.from('sponsees').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function restoreSponsee(id: string) {
  const { error } = await supabase.from('sponsees').update({ archived_at: null }).eq('id', id);
  if (error) throw error;
}

export interface SponsorshipLogEntry {
  id: string;
  name: string;
  created_at: string;
  archived_at: string | null;
  current_step: string;
}

// Every sponsee the sponsor has ever had, active and archived together --
// an auto-derived personal record, not a performance metric. No fetch
// option to exclude archived here on purpose, since the whole point of
// this view is the combined history.
export function useSponsorshipLog() {
  const [entries, setEntries] = useState<SponsorshipLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsees')
      .select('id, name, created_at, archived_at, current_step')
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setEntries(data ?? []);
    }
    setLoading(false);
  }, []);

  return { entries, loading, error, refetch };
}
