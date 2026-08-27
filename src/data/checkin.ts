import { useCallback, useState } from 'react';

import { getEffectiveStatus } from '@/lib/assignmentStatus';
import { supabase } from '@/lib/supabase';

export interface CheckinAssignment {
  assignmentId: string;
  status: 'pending' | 'done' | 'overdue';
  dueDate: string | null;
  worksheetId: string;
  worksheetTitle: string;
  worksheetStep: string;
  worksheetPurpose: string;
  worksheetPrompts: string[];
}

export interface CheckinData {
  name: string;
  assignments: CheckinAssignment[];
}

export function useCheckin(sponseeId: string | undefined) {
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!sponseeId) return;
    setLoading(true);
    const { data: rows, error } = await supabase.rpc('checkin_get_sponsee', { p_sponsee_id: sponseeId });

    if (error) {
      setError(error.message);
    } else if (!rows || rows.length === 0) {
      setError(null);
      setData(null);
    } else {
      setError(null);
      setData({
        name: rows[0].name,
        assignments: rows
          .filter((r) => r.assignment_id)
          .map((r) => ({
            assignmentId: r.assignment_id as string,
            status: getEffectiveStatus(r.status as string, r.due_date),
            dueDate: r.due_date,
            worksheetId: r.worksheet_id as string,
            worksheetTitle: r.worksheet_title as string,
            worksheetStep: r.worksheet_step as string,
            worksheetPurpose: r.worksheet_purpose as string,
            worksheetPrompts: (r.worksheet_prompts as string[]) ?? [],
          })),
      });
    }
    setLoading(false);
  }, [sponseeId]);

  return { data, loading, error, refetch };
}

export async function setCheckinAssignmentStatus(
  sponseeId: string,
  assignmentId: string,
  status: 'pending' | 'done' | 'overdue',
  worksheetTitle?: string
) {
  const { error } = await supabase.rpc('checkin_set_assignment_status', {
    p_sponsee_id: sponseeId,
    p_assignment_id: assignmentId,
    p_status: status,
  });
  if (error) throw error;

  // Best-effort: the sponsor finding out is a nicety, not something the
  // sponsee's check-in action should ever fail or wait on.
  if (status === 'done') {
    supabase.functions
      .invoke('notify-sponsor', { body: { sponsee_id: sponseeId, worksheet_title: worksheetTitle } })
      .catch(() => {});
  }
}
