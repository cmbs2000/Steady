import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbReading {
  id: string;
  source: string;
  chapter_or_section: string;
  step_or_theme: string;
  sponsor_note: string | null;
}

// Mirrors the numeric-aware step sort in data/worksheets.ts so Readings and
// Worksheets list in the same order.
function stepSortKey(step: string) {
  const match = step.match(/^Step (\d+)$/);
  return match ? parseInt(match[1], 10) : -1;
}

function sortReadings(readings: DbReading[]) {
  return [...readings].sort(
    (a, b) =>
      stepSortKey(a.step_or_theme) - stepSortKey(b.step_or_theme) ||
      a.chapter_or_section.localeCompare(b.chapter_or_section)
  );
}

export function useReadings() {
  const [readings, setReadings] = useState<DbReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('readings')
      .select('id, source, chapter_or_section, step_or_theme, sponsor_note');

    if (error) setError(error.message);
    else {
      setError(null);
      setReadings(sortReadings(data ?? []));
    }
    setLoading(false);
  }, []);

  return { readings, loading, error, refetch };
}

export function useReading(id: string | undefined) {
  const [reading, setReading] = useState<DbReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('readings')
      .select('id, source, chapter_or_section, step_or_theme, sponsor_note')
      .eq('id', id)
      .maybeSingle();

    if (error) setError(error.message);
    else {
      setError(null);
      setReading(data);
    }
    setLoading(false);
  }, [id]);

  return { reading, loading, error, refetch };
}

// Distinct source values already in use, so the reading form can offer
// autocomplete suggestions without a hardcoded list.
export function useReadingSources() {
  const [sources, setSources] = useState<string[]>([]);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.from('readings').select('source');
    if (!error) {
      setSources(Array.from(new Set((data ?? []).map((r) => r.source))).sort());
    }
  }, []);

  return { sources, refetch };
}

export function useWorksheetIdsForReading(readingId: string | undefined) {
  const [worksheetIds, setWorksheetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!readingId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('worksheet_readings')
      .select('worksheet_id')
      .eq('reading_id', readingId);
    if (!error) setWorksheetIds((data ?? []).map((r) => r.worksheet_id));
    setLoading(false);
  }, [readingId]);

  return { worksheetIds, loading, refetch };
}

export interface ReadingInput {
  source: string;
  chapter_or_section: string;
  step_or_theme: string;
  sponsor_note: string | null;
}

async function setWorksheetLinksForReading(readingId: string, worksheetIds: string[]) {
  const { error: deleteError } = await supabase.from('worksheet_readings').delete().eq('reading_id', readingId);
  if (deleteError) throw deleteError;

  if (worksheetIds.length === 0) return;
  const { error: insertError } = await supabase
    .from('worksheet_readings')
    .insert(worksheetIds.map((worksheetId) => ({ worksheet_id: worksheetId, reading_id: readingId })));
  if (insertError) throw insertError;
}

export async function createReading(input: ReadingInput, worksheetIds: string[]) {
  const { data, error } = await supabase.from('readings').insert(input).select('id').single();
  if (error) throw error;
  await setWorksheetLinksForReading(data.id, worksheetIds);
}

export async function updateReading(id: string, input: ReadingInput, worksheetIds: string[]) {
  const { error } = await supabase.from('readings').update(input).eq('id', id);
  if (error) throw error;
  await setWorksheetLinksForReading(id, worksheetIds);
}

// Deleting a reading with an active (pending/overdue) assignment would
// silently orphan whatever's on a sponsee's checklist, so this is checked
// before the delete confirmation is even shown -- unlike worksheets, which
// only warn. Returns the distinct sponsee names still holding it.
export async function getBlockingAssignmentsForReading(readingId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('sponsee:sponsees(name)')
    .eq('reading_id', readingId)
    .in('status', ['pending', 'overdue']);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((a) => a.sponsee?.name).filter((n): n is string => !!n)));
}

export async function deleteReading(id: string) {
  const { error } = await supabase.from('readings').delete().eq('id', id);
  if (error) throw error;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function assignReading(sponseeId: string, readingId: string) {
  const { error } = await supabase
    .from('assignments')
    .insert({ sponsee_id: sponseeId, reading_id: readingId, due_date: addDays(7) });
  if (error) throw error;
}

export function useReadingsForWorksheet(worksheetId: string | undefined) {
  const [readings, setReadings] = useState<DbReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!worksheetId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('worksheet_readings')
      .select('reading:readings(id, source, chapter_or_section, step_or_theme, sponsor_note)')
      .eq('worksheet_id', worksheetId);

    if (error) setError(error.message);
    else {
      setError(null);
      const rows = (data ?? []).map((r) => r.reading).filter((r): r is DbReading => r !== null);
      setReadings(sortReadings(rows));
    }
    setLoading(false);
  }, [worksheetId]);

  return { readings, loading, error, refetch };
}
