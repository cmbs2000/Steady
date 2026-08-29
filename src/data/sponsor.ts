import { useCallback, useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export function useFaqPromptDismissed() {
  const { session } = useAuth();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  const refetch = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('sponsors')
      .select('faq_prompt_dismissed_at')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!error) setDismissed(!!data?.faq_prompt_dismissed_at);
  }, [session]);

  const dismiss = useCallback(async () => {
    if (!session) return;
    setDismissed(true);
    await supabase
      .from('sponsors')
      .update({ faq_prompt_dismissed_at: new Date().toISOString() })
      .eq('id', session.user.id);
  }, [session]);

  return { dismissed, refetch, dismiss };
}
