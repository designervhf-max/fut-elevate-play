import { supabase } from '@/integrations/supabase/client';

export async function getSetupRoute(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_game_type, calibration_completed')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !profile.preferred_game_type) {
    return '/setup';
  }

  if (!profile.calibration_completed) {
    return '/calibration';
  }

  return '/home';
}
