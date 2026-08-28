import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbRecurringAssignment {
  id: string;
  worksheet_id: string;
  worksheet: { id: string; title: string; step: string } | null;
}

export function useRecurringAssignments(sponseeId: string | undefined) {
  const [recurring, setRecurring] = useState<DbRecurringAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!sponseeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('recurring_assignments')
      .select('id, worksheet_id, worksheet:worksheets(id, title, step)')
      .eq('sponsee_id', sponseeId);

    if (error) setError(error.message);
    else {
      setError(null);
      setRecurring((data ?? []) as DbRecurringAssignment[]);
    }
    setLoading(false);
  }, [sponseeId]);

  return { recurring, loading, error, refetch };
}

export async function addRecurringAssignment(sponseeId: string, worksheetId: string) {
  const { error } = await supabase
    .from('recurring_assignments')
    .insert({ sponsee_id: sponseeId, worksheet_id: worksheetId });
  if (error) throw error;
}

export async function removeRecurringAssignment(id: string) {
  const { error } = await supabase.from('recurring_assignments').delete().eq('id', id);
  if (error) throw error;
}
