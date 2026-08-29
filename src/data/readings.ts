import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbReading {
  id: string;
  source: string;
  chapter_or_section: string;
  step_or_theme: string;
  sponsor_note: string;
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
