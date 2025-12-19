import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Clock, MapPin, Users, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

type NextMatch = {
  id: string;
  match_date: string;
  match_time: string;
  pelada_id: string;
  pelada_name: string;
  location: string;
  confirmed_count: number;
  max_players: number;
  user_status: 'Confirmado' | 'Pendente' | null;
};

interface NextMatchCardProps {
  userId: string;
}

const NextMatchCard = ({ userId }: NextMatchCardProps) => {
  const navigate = useNavigate();
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextMatch();
  }, [userId]);

  const fetchNextMatch = async () => {
    // Get peladas user is member of
    const { data: memberships } = await supabase
      .from('pelada_members')
      .select('pelada_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      setLoading(false);
      return;
    }

    const peladaIds = memberships.map(m => m.pelada_id);

    // Get upcoming matches
    const today = new Date().toISOString().split('T')[0];
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        pelada_id,
        peladas!inner(name, location, max_players)
      `)
      .in('pelada_id', peladaIds)
      .in('status', ['scheduled', 'in_progress'])
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })
      .limit(1);

    if (!matches || matches.length === 0) {
      setLoading(false);
      return;
    }

    const match = matches[0];

    // Get participants count
    const { count } = await supabase
      .from('match_participants')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', match.id)
      .eq('status', 'Confirmado');

    // Get user participation
    const { data: userParticipation } = await supabase
      .from('match_participants')
      .select('status')
      .eq('match_id', match.id)
      .eq('user_id', userId)
      .maybeSingle();

    const pelada = match.peladas as unknown as { name: string; location: string; max_players: number };

    setNextMatch({
      id: match.id,
      match_date: match.match_date,
      match_time: match.match_time,
      pelada_id: match.pelada_id,
      pelada_name: pelada.name,
      location: pelada.location,
      confirmed_count: count || 0,
      max_players: pelada.max_players,
      user_status: userParticipation?.status as 'Confirmado' | 'Pendente' | null,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fifa-card p-4 animate-pulse">
        <div className="h-4 bg-surface rounded w-1/3 mb-3" />
        <div className="h-6 bg-surface rounded w-2/3 mb-2" />
        <div className="h-4 bg-surface rounded w-1/2" />
      </div>
    );
  }

  if (!nextMatch) {
    return null;
  }

  const matchDate = new Date(nextMatch.match_date + 'T00:00:00');
  const isToday = matchDate.toDateString() === new Date().toDateString();

  return (
    <div
      className="fifa-card p-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/pelada/${nextMatch.pelada_id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Próxima Partida
        </span>
        {nextMatch.user_status === 'Confirmado' ? (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" />
            Confirmado
          </span>
        ) : nextMatch.user_status === 'Pendente' ? (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
            <AlertCircle className="h-3 w-3" />
            Pendente
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h4 className="font-display text-lg tracking-wider text-primary">
            {nextMatch.pelada_name}
          </h4>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {isToday ? (
                <span className="text-primary font-semibold">HOJE</span>
              ) : (
                matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {nextMatch.match_time.slice(0, 5)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {nextMatch.location}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {nextMatch.confirmed_count}/{nextMatch.max_players}
            </div>
          </div>
        </div>

        <ChevronRight className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-surface rounded-full h-1.5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-lime transition-all duration-500"
          style={{ width: `${Math.min((nextMatch.confirmed_count / nextMatch.max_players) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default NextMatchCard;
