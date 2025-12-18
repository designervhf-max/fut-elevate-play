import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import UpcomingMatch from '@/components/UpcomingMatch';
import PastMatchesList from '@/components/PastMatchesList';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  Share2,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWeekdayLabel } from '@/lib/weekday';

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
  
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [membership, setMembership] = useState<PeladaMember | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [nextMatchParticipants, setNextMatchParticipants] = useState<MatchParticipant[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUserId(session.user.id);

    // Fetch pelada details
    const { data: peladaData, error: peladaError } = await supabase
      .from('peladas')
      .select('*')
      .eq('id', id)
      .single();

    if (peladaError || !peladaData) {
      toast({
        title: 'Erro',
        description: 'Pelada não encontrada',
        variant: 'destructive',
      });
      navigate('/games');
      return;
    }

    setPelada(peladaData as Pelada);

    // Fetch user's membership
    const { data: memberData } = await supabase
      .from('pelada_members')
      .select('*')
      .eq('pelada_id', id)
      .eq('user_id', session.user.id)
      .single();

    if (memberData) {
      setMembership(memberData as PeladaMember);
    }

    // Fetch next match (scheduled or in_progress)
    const today = new Date().toISOString().split('T')[0];
    const { data: upcomingMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('pelada_id', id)
      .gte('match_date', today)
      .in('status', ['scheduled', 'in_progress'])
      .order('match_date', { ascending: true })
      .limit(1);

    if (upcomingMatches && upcomingMatches.length > 0) {
      const match = upcomingMatches[0] as Match;
      setNextMatch(match);

      // Fetch participants for next match
      const { data: participants } = await supabase
        .from('match_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('match_id', match.id);

      if (participants) {
        setNextMatchParticipants(participants as MatchParticipant[]);
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
  }, [id, navigate, toast]);

  const shareInvite = async () => {
    if (!pelada) return;
    
    const url = `${window.location.origin}/join-pelada/${pelada.id}`;
    const text = `⚽ ${pelada.name}\n📅 ${getWeekdayLabel(pelada.weekday)} às ${pelada.time.slice(0, 5)}\n📍 ${pelada.location}\n\nVem jogar!`;
    
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

  const isAdmin = membership?.role === 'admin';

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
              <button
                onClick={() => {/* TODO: pelada settings */}}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
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
              Máx: {pelada.max_players} jogadores
            </div>
          </div>
        </section>

        {/* Seção 1: Próxima Partida */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            🔹 Próxima Partida
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

        {/* Seção 2: Jogos Anteriores */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            📊 Jogos Anteriores
          </h3>
          <PastMatchesList matches={pastMatches} peladaId={pelada.id} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default PeladaDetails;
