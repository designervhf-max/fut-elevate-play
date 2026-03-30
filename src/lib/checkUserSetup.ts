import { supabase } from '@/integrations/supabase/client';

export async function getSetupRoute(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_game_type')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !profile.preferred_game_type) {
    return '/setup';
  }

  return '/home';
}
