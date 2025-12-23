import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import UpcomingMatch from '@/components/UpcomingMatch';
import PastMatchesList from '@/components/PastMatchesList';
import PeladaSettingsDialog from '@/components/PeladaSettingsDialog';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  Share2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWeekdayLabel } from '@/lib/weekday';
import { useMasterUser } from '@/hooks/useMasterUser';

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

// Types
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
  stats_submitted: boolean;
  rating: number | null;
  team: number | null;
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

const PeladaDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMaster } = useMasterUser();
  
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [membership, setMembership] = useState<PeladaMember | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [nextMatchParticipants, setNextMatchParticipants] = useState<MatchParticipant[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = async () => {
    let currentUserId = 'master-user-id';
    
    // Master user bypass
    if (!isMaster) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      currentUserId = session.user.id;
    }
    
    setUserId(currentUserId);

    // Fetch pelada details
    const { data: peladaData, error: peladaError } = await supabase
      .from('peladas')
      .select('*')
      .eq('id', id)
      .single();

    if (peladaError || !peladaData) {
      toast({
        title: 'Erro',
        description: 'Pelada nao encontrada',
        variant: 'destructive',
      });
      navigate('/games');
      return;
    }

    setPelada(peladaData as Pelada);

    // For master user, set admin membership
    if (isMaster) {
      setMembership({
        id: 'master',
        pelada_id: id!,
        user_id: 'master-user-id',
        role: 'admin',
      });
    } else {
      // Fetch user's membership
      const { data: memberData } = await supabase
        .from('pelada_members')
        .select('*')
        .eq('pelada_id', id)
        .eq('user_id', currentUserId)
        .single();

      if (memberData) {
        setMembership(memberData as PeladaMember);
      }
    }

    // Fetch next match (scheduled, in_progress, or recently finished for voting)
    const today = new Date().toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    // First try to get scheduled or in_progress match
    const { data: upcomingMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', id)
      .gte('match_date', today)
      .in('status', ['scheduled', 'in_progress'])
      .order('match_date', { ascending: true })
      .limit(1);

    let matchToUse: Match | null = null;

    if (upcomingMatches && upcomingMatches.length > 0) {
      matchToUse = upcomingMatches[0] as Match;
    } else {
      // Check for recently finished match (< 48h) that's still votable
      const { data: recentFinished } = await supabase
        .from('matches')
        .select('*')
        .eq('pelada_id', id)
        .eq('status', 'finished')
        .gte('ended_at', twoDaysAgo)
        .order('ended_at', { ascending: false })
        .limit(1);

      if (recentFinished && recentFinished.length > 0) {
        matchToUse = recentFinished[0] as Match;
      } else if (isMaster || membership?.role === 'admin') {
        // Auto-create next match if admin and no upcoming/recent match exists
        const nextMatchDate = getNextMatchDate(peladaData.weekday);
        
        const { data: newMatch, error: createError } = await supabase
          .from('matches')
          .insert({
            pelada_id: id,
            match_date: nextMatchDate,
            match_time: peladaData.time,
            location: peladaData.location,
            status: 'scheduled',
          })
          .select()
          .single();

        if (!createError && newMatch) {
          matchToUse = newMatch as Match;
        }
      }
    }

    if (matchToUse) {
      setNextMatch(matchToUse);

      // Fetch participants for next match
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', matchToUse.id)
        .order('created_at', { ascending: true }); // First come first served

      if (participantsData) {
        // Fetch profiles for participants with user_id
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

        const participantsWithProfiles = participantsData.map(p => ({
          ...p,
          profile: p.user_id ? profilesMap[p.user_id] : undefined,
        }));

        setNextMatchParticipants(participantsWithProfiles as MatchParticipant[]);
      }
    }

    // Fetch past matches (finished)
    const { data: pastMatchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', id)
      .eq('status', 'finished')
      .order('match_date', { ascending: false });

    if (pastMatchesData) {
      setPastMatches(pastMatchesData as Match[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate, toast, isMaster]);

  const shareInvite = async () => {
    if (!pelada) return;
    
    const url = `${window.location.origin}/join-pelada/${pelada.id}`;
    const text = `${pelada.name}\n${getWeekdayLabel(pelada.weekday)} as ${pelada.time.slice(0, 5)}\n${pelada.location}\n\nVem jogar!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: pelada.name, text, url });
      } catch (err) {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast({ title: 'Link copiado!' });
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast({ title: 'Link copiado!' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pelada) return null;

  const isAdmin = membership?.role === 'admin' || isMaster;

  const matchDateFormatted = nextMatch 
    ? new Date(nextMatch.match_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : undefined;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/games')}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-display tracking-wider">{pelada.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shareInvite}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {isAdmin && (
              <PeladaSettingsDialog
                peladaId={pelada.id}
                peladaName={pelada.name}
                matchId={nextMatch?.id}
                matchDate={matchDateFormatted}
              />
            )}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Pelada Info */}
        <section className="fifa-card p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
              {pelada.game_type}
            </span>
            {isAdmin && (
              <span className="text-xs bg-surface text-muted-foreground px-3 py-1 rounded-full">
                Administrador
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {getWeekdayLabel(pelada.weekday)}
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {pelada.time.slice(0, 5)}
            </div>
            <div className="flex items-center gap-2 text-foreground col-span-2">
              <MapPin className="h-4 w-4 text-primary" />
              {pelada.location}
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Max: {pelada.max_players} jogadores
            </div>
          </div>
        </section>

        {/* Proxima Partida */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Proxima Partida
          </h3>
          <UpcomingMatch
            match={nextMatch}
            participants={nextMatchParticipants}
            pelada={pelada}
            userId={userId}
            isAdmin={isAdmin}
            onRefresh={fetchData}
          />
        </section>

        {/* Jogos Anteriores */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Jogos Anteriores
          </h3>
          <PastMatchesList matches={pastMatches} peladaId={pelada.id} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default PeladaDetails;
