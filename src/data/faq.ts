import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DbFaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

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
