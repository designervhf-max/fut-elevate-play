import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

// Note: 'phone' column is not selectable directly via RLS for privacy.
// Users can fetch their own phone via the get_my_phone() RPC.
const PROFILE_COLUMNS =
  'id, name, age, position, shirt_number, dominant_foot, avatar_url, ' +
  'preferred_game_type, overall_rating, attack_rating, defense_rating, ' +
  'skill_rating, strength_rating, total_goals, total_assists, total_saves, ' +
  'total_mvps, total_best_defender, total_games, total_participations, ' +
  'calibration_completed, created_at';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
}
