import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Pelada = {
  id: string;
  name: string;
  location: string;
  weekday: number;
  time: string;
  game_type: string;
  max_players: number;
  status: string;
  created_at: string;
  creator_id: string;
};

type Match = {
  id: string;
  pelada_id: string;
  match_date: string;
  match_time: string;
  status: string;
};

type PeladaMember = {
  id: string;
  pelada_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
};

export type PeladaWithDetails = Pelada & {
  member: PeladaMember;
  nextMatch: Match | null;
  userMatchStatus: string | null;
};

async function fetchUserPeladas(userId: string): Promise<PeladaWithDetails[]> {
  // 1. Fetch all memberships with pelada data in one query
  const { data: memberships, error: memberError } = await supabase
    .from('pelada_members')
    .select(`
      *,
      pelada:peladas(*)
    `)
    .eq('user_id', userId);

  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return [];

  const peladaIds = memberships.map(m => m.pelada_id);
  const today = new Date().toISOString().split('T')[0];

  // 2. Fetch ALL upcoming matches for all peladas in ONE query
  const { data: allMatches } = await supabase
    .from('matches')
    .select('*')
    .in('pelada_id', peladaIds)
    .gte('match_date', today)
    .in('status', ['scheduled','in_progress','criada','confirmacoes_abertas','em_andamento'])
    .order('match_date', { ascending: true });

  // Group matches by pelada_id and get the first (next) match for each
  const nextMatchByPelada: Record<string, Match> = {};
  allMatches?.forEach(match => {
    if (!nextMatchByPelada[match.pelada_id]) {
      nextMatchByPelada[match.pelada_id] = match as Match;
    }
  });

  // 3. Get all match IDs that we need participation status for
  const matchIds = Object.values(nextMatchByPelada).map(m => m.id);

  // 4. Fetch user participation for ALL matches in ONE query
  const { data: participations } = matchIds.length > 0 
    ? await supabase
        .from('match_participants')
        .select('match_id, status')
        .in('match_id', matchIds)
        .eq('user_id', userId)
    : { data: [] };

  // Create lookup map for participation status
  const participationByMatch: Record<string, string> = {};
  participations?.forEach(p => {
    participationByMatch[p.match_id] = p.status;
  });

  // 5. Combine all data
  return memberships
    .filter(m => (m.pelada as Pelada).status === 'active')
    .map(membership => {
      const pelada = membership.pelada as Pelada;
      const nextMatch = nextMatchByPelada[pelada.id] || null;
      const userMatchStatus = nextMatch ? participationByMatch[nextMatch.id] || null : null;

      return {
        ...pelada,
        member: {
          id: membership.id,
          pelada_id: membership.pelada_id,
          user_id: membership.user_id,
          role: membership.role as 'admin' | 'member',
          joined_at: membership.joined_at,
        },
        nextMatch,
        userMatchStatus,
      };
    });
}

export function usePeladas(userId: string | null) {
  return useQuery({
    queryKey: ['peladas', userId],
    queryFn: () => fetchUserPeladas(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  });
}
