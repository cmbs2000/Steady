import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbFaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// Seeded content's id for "What if they miss a check-in — how long before I
// reach out?", used to deep-link straight to it from the sponsee detail
// screen's missed-check-in nudge. Hardcoded rather than matched by question
// text, since the id is stable even if the wording gets edited later.
export const MISSED_CHECKIN_FAQ_ID = '52c5daca-a272-4ddb-8d77-0d5ccabefa16';

export function useFaqItems() {
  const [items, setItems] = useState<DbFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('faq_items')
      .select('id, question, answer, sort_order')
      .order('sort_order');

    if (error) setError(error.message);
    else {
      setError(null);
      setItems(data ?? []);
    }
    setLoading(false);
  }, []);

  return { items, loading, error, refetch };
}
