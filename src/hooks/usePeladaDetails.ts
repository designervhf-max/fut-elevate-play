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
  creator_id: string;
  price_per_game: number | null;
};

type Match = {
  id: string;
  pelada_id: string;
  match_date: string;
  match_time: string;
  open_for_confirmation: boolean;
  location: string | null;
  status: string;
  mvp_id: string | null;
  best_defender_id: string | null;
  results_determined: boolean;
  ended_at: string | null;
  started_at: string | null;
};

type MatchParticipant = {
  id: string;
  match_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_position: string | null;
  status: string;
  goals: number;
  assists: number;
  saves: number;
  stats_submitted: boolean;
  rating: number | null;
  team: number | null;
  paid: boolean;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
    overall_rating: number;
  };
};

type PeladaMember = {
  id: string;
  pelada_id: string;
  user_id: string;
  role: 'admin' | 'member';
};

export type PeladaDetailsData = {
  pelada: Pelada;
  membership: PeladaMember | null;
  nextMatch: Match | null;
  nextMatchParticipants: MatchParticipant[];
  pastMatches: Match[];
};

// Helper to calculate next match date based on weekday
const getNextMatchDate = (weekday: number): string => {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilNext = weekday - currentDay;
  
  if (daysUntilNext <= 0) {
    daysUntilNext += 7;
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  
  return nextDate.toISOString().split('T')[0];
};

async function fetchPeladaDetails(
  peladaId: string, 
  userId: string
): Promise<PeladaDetailsData> {
  // Batch 1: Fetch pelada and membership in parallel
  const [peladaResult, memberResult] = await Promise.all([
    supabase
      .from('peladas')
      .select('*')
      .eq('id', peladaId)
      .single(),
    supabase
      .from('pelada_members')
      .select('*')
      .eq('pelada_id', peladaId)
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  if (peladaResult.error || !peladaResult.data) {
    throw new Error('Pelada não encontrada');
  }

  const pelada = peladaResult.data as Pelada;
  const membership = memberResult.data as PeladaMember | null;
  const isAdmin = membership?.role === 'admin';

  // Batch 2: Fetch matches (upcoming and past) in parallel
  const today = new Date().toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [upcomingResult, recentFinishedResult, pastResult] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', peladaId)
      .gte('match_date', today)
      .in('status', ['scheduled','in_progress','criada','confirmacoes_abertas','em_andamento'])
      .order('match_date', { ascending: true })
      .limit(1),
    supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', peladaId)
      .in('status', ['finished','encerrada'])
      .gte('ended_at', twoDaysAgo)
      .order('ended_at', { ascending: false })
      .limit(1),
    supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', peladaId)
      .in('status', ['finished','encerrada'])
      .order('match_date', { ascending: false })
      .limit(20)
  ]);

  let matchToUse: Match | null = null;

  if (upcomingResult.data && upcomingResult.data.length > 0) {
    matchToUse = upcomingResult.data[0] as Match;
  } else if (recentFinishedResult.data && recentFinishedResult.data.length > 0) {
    matchToUse = recentFinishedResult.data[0] as Match;
  } else if (isAdmin) {
    // Auto-create next match if admin and no upcoming/recent match exists
    const nextMatchDate = getNextMatchDate(pelada.weekday);
    
    const { data: newMatch, error: createError } = await supabase
      .from('matches')
      .insert({
        pelada_id: peladaId,
        match_date: nextMatchDate,
        match_time: pelada.time,
        location: pelada.location,
        status: 'criada',
      })
      .select()
      .single();

    if (!createError && newMatch) {
      matchToUse = newMatch as Match;
    }
  }

  // Batch 3: Fetch participants if we have a match
  let participants: MatchParticipant[] = [];
  
  if (matchToUse) {
    const { data: participantsData } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', matchToUse.id)
      .order('created_at', { ascending: true });

    if (participantsData) {
      // Get user IDs for profile fetch
      const userIds = participantsData
        .filter(p => p.user_id)
        .map(p => p.user_id as string);

      let profilesMap: Record<string, MatchParticipant['profile']> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, position, avatar_url, overall_rating')
          .in('id', userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = {
              id: p.id,
              name: p.name,
              position: p.position,
              avatar_url: p.avatar_url,
              overall_rating: p.overall_rating || 50,
            };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      participants = participantsData.map(p => ({
        ...p,
        profile: p.user_id ? profilesMap[p.user_id] : undefined,
      })) as MatchParticipant[];
    }
  }

  return {
    pelada,
    membership,
    nextMatch: matchToUse,
    nextMatchParticipants: participants,
    pastMatches: (pastResult.data || []) as Match[],
  };
}

export function usePeladaDetails(peladaId: string | undefined, userId: string | null) {
  return useQuery({
    queryKey: ['peladaDetails', peladaId, userId],
    queryFn: () => fetchPeladaDetails(peladaId!, userId!),
    enabled: !!peladaId && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
