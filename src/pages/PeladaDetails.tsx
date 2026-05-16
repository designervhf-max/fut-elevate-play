import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import UpcomingMatch from '@/components/UpcomingMatch';
import PastMatchesList from '@/components/PastMatchesList';
import PeladaSettingsDialog from '@/components/PeladaSettingsDialog';
import PeladaRanking from '@/components/PeladaRanking';
import ProFeatureGate from '@/components/ProFeatureGate';
import PeladaInfoTab from '@/components/PeladaInfoTab';
import PeladaDetailsSkeleton from '@/components/skeletons/PeladaDetailsSkeleton';
import MatchCountdown from '@/components/MatchCountdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Share2,
  Info,
  Calendar,
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
  const [actionLoading, setActionLoading] = useState(false);

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
    const text = `${data.pelada.name}\n${getWeekdayLabel(data.pelada.weekday)} às ${data.pelada.time.slice(0, 5)}\n${data.pelada.location}\n\nVem jogar!`;
    
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

  const handleConfirmPresence = async () => {
    if (!userId || !data?.nextMatch) return;
    setActionLoading(true);

    const userParticipation = data.nextMatchParticipants.find(p => p.user_id === userId);
    const confirmedCount = data.nextMatchParticipants.filter(p => p.status === 'Confirmado').length;
    const isFull = confirmedCount >= data.pelada.max_players;

    // Determine status based on capacity
    const newStatus = isFull ? 'Lista de Espera' : 'Confirmado';

    if (userParticipation) {
      const { error } = await supabase
        .from('match_participants')
        .update({ status: newStatus })
        .eq('id', userParticipation.id);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível confirmar presença', variant: 'destructive' });
      } else {
        toast({ title: isFull ? 'Você está na lista de espera' : 'Presença confirmada!' });
        await handleRefresh();
      }
    } else {
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: data.nextMatch.id,
          user_id: userId,
          status: newStatus,
        });

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível confirmar presença', variant: 'destructive' });
      } else {
        toast({ title: isFull ? 'Você está na lista de espera' : 'Presença confirmada!' });
        await handleRefresh();
      }
    }

    setActionLoading(false);
  };

  const handleCancelPresence = async () => {
    if (!userId || !data?.nextMatch) return;
    setActionLoading(true);

    const userParticipation = data.nextMatchParticipants.find(p => p.user_id === userId);
    
    if (userParticipation) {
      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('id', userParticipation.id);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível cancelar presença', variant: 'destructive' });
      } else {
        toast({ title: 'Presença cancelada' });
        await handleRefresh();
      }
    }

    setActionLoading(false);
  };

  const handleStartMatch = async () => {
    if (!data?.nextMatch) return;
    navigate(`/match/${data.nextMatch.id}/live`);
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

  const userParticipation = nextMatchParticipants.find(p => p.user_id === userId);
  const isConfirmed = userParticipation?.status === 'Confirmado';
  const isWaitlist = userParticipation?.status === 'Lista de Espera';
  const canShowActions = nextMatch && nextMatch.status !== 'finished' && nextMatch.open_for_confirmation;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-40">
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
              <h1 className="text-xl font-semibold">{pelada.name}</h1>
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

        {/* Countdown Badge */}
        {nextMatch && nextMatch.status !== 'finished' && (
          <div className="px-4 pt-4 animate-slide-up">
            <MatchCountdown
              matchDate={nextMatch.match_date}
              matchTime={nextMatch.match_time}
              variant="full"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="partida" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="info" className="flex items-center gap-1.5 text-xs">
              <Info className="h-3.5 w-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="partida" className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              Partida
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-1.5 text-xs">
              <Trophy className="h-3.5 w-3.5" />
              Ranking
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="animate-slide-up">
            <PeladaInfoTab pelada={pelada} isAdmin={isAdmin} />
          </TabsContent>

          {/* Partida Tab */}
          <TabsContent value="partida" className="space-y-6 animate-slide-up">
            <UpcomingMatch
              match={nextMatch}
              participants={nextMatchParticipants}
              pelada={pelada}
              userId={userId}
              isAdmin={isAdmin}
              onRefresh={handleRefresh}
            />

            {/* Past Matches */}
            {pastMatches.length > 0 && (
              <section>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Jogos Anteriores
                </h3>
                <ProFeatureGate feature="match_history" fallbackTitle="Histórico de Partidas">
                  <PastMatchesList matches={pastMatches} peladaId={pelada.id} />
                </ProFeatureGate>
              </section>
            )}
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="animate-slide-up">
            <ProFeatureGate feature="ranking" fallbackTitle="Ranking da Pelada">
              <PeladaRanking peladaId={pelada.id} />
            </ProFeatureGate>
          </TabsContent>
        </Tabs>

        <BottomNav />
      </div>
    </div>
  );
};

export default PeladaDetails;
