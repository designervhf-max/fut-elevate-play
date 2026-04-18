import { supabase } from '@/integrations/supabase/client';

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('preferred_game_type, calibration_completed')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function getSetupRoute(userId: string): Promise<string> {
  let profile = await fetchProfile(userId);

  // O trigger handle_new_user roda de forma síncrona no banco, mas pode
  // haver um pequeno gap entre a sessão OAuth ser emitida e o profile row
  // estar visível para a réplica de leitura. Tentamos até 3 vezes com
  // backoff antes de assumir que é um usuário genuinamente novo.
  if (!profile) {
    const delays = [300, 700, 1500];
    for (const delay of delays) {
      await new Promise<void>(r => setTimeout(r, delay));
      profile = await fetchProfile(userId);
      if (profile) break;
    }
  }

  if (!profile || !profile.preferred_game_type) {
    return '/setup';
  }

  if (!profile.calibration_completed) {
    return '/calibration';
  }

  return '/home';
}
