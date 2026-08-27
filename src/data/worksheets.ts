import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbWorksheet {
  id: string;
  title: string;
  step: string;
  type: string;
  purpose: string;
  prompts: string[];
}

export const STEP_OPTIONS = [...Array.from({ length: 12 }, (_, i) => `Step ${i + 1}`), 'Daily'];
export const WORKSHEET_TYPE_OPTIONS = ['worksheet', 'check-in', 'reading'] as const;

// Sorting by the `step` text column directly gives "Step 1", "Step 10",
// "Step 11", ... "Step 2" — this pulls out the step number so lists actually
// read in program order, with Daily entries grouped first since they're
// used the most often.
function stepSortKey(step: string) {
  const match = step.match(/^Step (\d+)$/);
  return match ? parseInt(match[1], 10) : -1;
}

function sortWorksheets(worksheets: DbWorksheet[]) {
  return [...worksheets].sort(
    (a, b) => stepSortKey(a.step) - stepSortKey(b.step) || a.title.localeCompare(b.title)
  );
}

export function useWorksheets() {
  const [worksheets, setWorksheets] = useState<DbWorksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('worksheets').select('id, title, step, type, purpose, prompts');

    if (error) setError(error.message);
    else {
      setError(null);
      setWorksheets(sortWorksheets(data ?? []));
    }
    setLoading(false);
  }, []);

  return { worksheets, loading, error, refetch };
}

export function useWorksheet(id: string | undefined) {
  const [worksheet, setWorksheet] = useState<DbWorksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('worksheets')
      .select('id, title, step, type, purpose, prompts')
      .eq('id', id)
      .maybeSingle();

    if (error) setError(error.message);
    else {
      setError(null);
      setWorksheet(data);
    }
    setLoading(false);
  }, [id]);

  return { worksheet, loading, error, refetch };
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function assignWorksheet(sponseeId: string, worksheetId: string) {
  const { error } = await supabase
    .from('assignments')
    .insert({ sponsee_id: sponseeId, worksheet_id: worksheetId, due_date: addDays(7) });
  if (error) throw error;
}

export async function unassignWorksheet(assignmentId: string) {
  const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
  if (error) throw error;
}

export async function updateAssignmentDueDate(assignmentId: string, dueDate: string) {
  const { error } = await supabase.from('assignments').update({ due_date: dueDate }).eq('id', assignmentId);
  if (error) throw error;
}

export interface WorksheetInput {
  title: string;
  step: string;
  type: string;
  purpose: string;
  prompts: string[];
}

export async function createWorksheet(input: WorksheetInput) {
  const { error } = await supabase.from('worksheets').insert(input);
  if (error) throw error;
}

export async function updateWorksheet(id: string, input: WorksheetInput) {
  const { error } = await supabase.from('worksheets').update(input).eq('id', id);
  if (error) throw error;
}

export async function countAssignmentsForWorksheet(worksheetId: string) {
  const { count, error } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('worksheet_id', worksheetId);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteWorksheet(id: string) {
  const { error } = await supabase.from('worksheets').delete().eq('id', id);
  if (error) throw error;
}
