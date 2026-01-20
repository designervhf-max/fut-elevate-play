import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import UpcomingMatch from '@/components/UpcomingMatch';
import PastMatchesList from '@/components/PastMatchesList';
import PeladaSettingsDialog from '@/components/PeladaSettingsDialog';
import PeladaRanking from '@/components/PeladaRanking';
import PeladaDetailsSkeleton from '@/components/skeletons/PeladaDetailsSkeleton';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Share2,
  Trophy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWeekdayLabel } from '@/lib/weekday';
import { usePeladaDetails } from '@/hooks/usePeladaDetails';
import { useQueryClient } from '@tanstack/react-query';

const PeladaDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);
    };

    checkSession();
  }, [navigate]);

  const { data, isLoading, error, refetch } = usePeladaDetails(id, userId);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro',
        description: 'Pelada não encontrada',
        variant: 'destructive',
      });
      navigate('/games');
    }
  }, [error, navigate, toast]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['peladaDetails', id, userId] });
    refetch();
  };

  const shareInvite = async () => {
    if (!data?.pelada) return;
    
    const url = `${window.location.origin}/join-pelada/${data.pelada.id}`;
    const text = `${data.pelada.name}\n${getWeekdayLabel(data.pelada.weekday)} as ${data.pelada.time.slice(0, 5)}\n${data.pelada.location}\n\nVem jogar!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: data.pelada.name, text, url });
      } catch (err) {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast({ title: 'Link copiado!' });
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast({ title: 'Link copiado!' });
    }
  };

  if (isLoading || !userId) {
    return <PeladaDetailsSkeleton />;
  }

  if (!data?.pelada) return null;

  const { pelada, membership, nextMatch, nextMatchParticipants, pastMatches } = data;
  const isAdmin = membership?.role === 'admin';

  const matchDateFormatted = nextMatch 
    ? new Date(nextMatch.match_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
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
            onRefresh={handleRefresh}
          />
        </section>

        {/* Ranking da Pelada */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Ranking da Pelada
          </h3>
          <PeladaRanking peladaId={pelada.id} />
        </section>

        {/* Jogos Anteriores */}
        <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Jogos Anteriores
          </h3>
          <PastMatchesList matches={pastMatches} peladaId={pelada.id} />
        </section>
      </main>

      <BottomNav />
      </div>
    </div>
  );
};

export default PeladaDetails;
