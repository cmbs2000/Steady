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
  assignments: { status: 'pending' | 'done' | 'overdue' }[];
}

export interface DbSponseeDetail extends Omit<DbSponsee, 'assignments'> {
  notes: string | null;
  assignments: {
    id: string;
    status: 'pending' | 'done' | 'overdue';
    due_date: string | null;
    worksheet: { id: string; title: string; step: string } | null;
  }[];
}

export function useSponsees() {
  const [sponsees, setSponsees] = useState<DbSponsee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sponsees')
      .select('id, name, phone, sobriety_date, current_step, streak_days, assignments(status, due_date)')
      .order('name');

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
  }, []);

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
        'id, name, phone, notes, sobriety_date, current_step, streak_days, assignments(id, status, due_date, worksheet:worksheets(id, title, step))'
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
