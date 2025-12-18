import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import TeamDrawResult from '@/components/TeamDrawResult';
import OrganizerStatsForm from '@/components/OrganizerStatsForm';
import PlayerVoting from '@/components/PlayerVoting';
import GameSummary from '@/components/GameSummary';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserMinus,
  Shuffle,
  Share2,
  X,
  Flag,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { getWeekdayLabel, formatNextOccurrence } from '@/lib/weekday';

type Game = Database['public']['Tables']['games']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type GameWithDetails = Game & {
  creator: Profile;
  participants: (GameParticipant & { profile: Profile })[];
};

const GameDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<GameWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTeamDraw, setShowTeamDraw] = useState(false);
  const [teamA, setTeamA] = useState<(GameParticipant & { profile: Profile })[]>([]);
  const [teamB, setTeamB] = useState<(GameParticipant & { profile: Profile })[]>([]);

  const fetchGame = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:profiles!games_creator_id_fkey(*),
        participants:game_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({
        title: 'Erro',
        description: 'Jogo não encontrado',
        variant: 'destructive',
      });
      navigate('/games');
      return;
    }

    setGame(data as unknown as GameWithDetails);
    setLoading(false);
  };

  useEffect(() => {
    fetchGame();
  }, [id, navigate, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pendente':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Recusado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'text-green-500';
      case 'Pendente':
        return 'text-yellow-500';
      case 'Recusado':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleLeaveGame = async () => {
    if (!userId || !game) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', game.id)
      .eq('user_id', userId);

    setActionLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível sair do jogo',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Você saiu do jogo',
    });
    navigate('/games');
  };

  const handleConfirmPresence = async () => {
    if (!userId || !game) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('game_participants')
      .update({ status: 'Confirmado' })
      .eq('game_id', game.id)
      .eq('user_id', userId);

    setActionLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar presença',
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p =>
          p.user_id === userId ? { ...p, status: 'Confirmado' } : p
        ),
      };
    });

    toast({
      title: 'Sucesso',
      description: 'Presença confirmada!',
    });
  };

  // Balanced team shuffle - distributes players alternately by rating
  const shuffleTeams = () => {
    const confirmed = game?.participants.filter(p => p.status === 'Confirmado') || [];
    
    if (confirmed.length < 2) {
      toast({
        title: 'Aviso',
        description: 'É necessário pelo menos 2 jogadores confirmados para sortear times',
        variant: 'destructive',
      });
      return;
    }

    // Sort by overall_rating descending
    const sorted = [...confirmed].sort(
      (a, b) => (b.profile.overall_rating || 0) - (a.profile.overall_rating || 0)
    );

    // Distribute alternately (draft style)
    const newTeamA: typeof confirmed = [];
    const newTeamB: typeof confirmed = [];
    
    sorted.forEach((player, index) => {
      if (index % 2 === 0) {
        newTeamA.push(player);
      } else {
        newTeamB.push(player);
      }
    });

    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setShowTeamDraw(true);
  };

  // Share invite link
  const shareInvite = async () => {
    if (!game) return;
    
    const url = `${window.location.origin}/game/${game.id}`;
    const text = `⚽ ${game.name}\n📅 ${getWeekdayLabel(game.weekday)} às ${game.time.slice(0, 5)}\n📍 ${game.location}\n\nVem jogar!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: game.name, text, url });
      } catch (err) {
        // User cancelled or error - fallback to clipboard
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast({ title: 'Link copiado!' });
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast({ title: 'Link copiado!' });
    }
  };

  // Remove participant (organizer only)
  const handleRemoveParticipant = async (participantUserId: string, participantName: string) => {
    if (!game || !isCreator) return;
    
    const confirmed = window.confirm(`Remover ${participantName} da pelada?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', game.id)
      .eq('user_id', participantUserId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o jogador',
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.filter(p => p.user_id !== participantUserId),
      };
    });

    toast({
      title: 'Sucesso',
      description: `${participantName} foi removido da pelada`,
    });
  };

  // End game (organizer only)
  const handleEndGame = async () => {
    if (!game || !isCreator) return;

    const confirmed = window.confirm(
      'Encerrar a partida? Após isso, você poderá registrar as estatísticas dos jogadores.'
    );
    if (!confirmed) return;

    setActionLoading(true);

    const { error } = await supabase
      .from('games')
      .update({ 
        status: 'Finalizado',
        ended_at: new Date().toISOString(),
      })
      .eq('id', game.id);

    setActionLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar a partida',
        variant: 'destructive',
      });
      return;
    }

    setGame((prev) => (prev ? { ...prev, status: 'Finalizado', ended_at: new Date().toISOString() } : prev));

    toast({
      title: 'Partida encerrada!',
      description: 'Registre as estatísticas dos jogadores',
    });
  };

  // Refresh game data after stats/votes submission
  const handleDataRefresh = async () => {
    await fetchGame();

    // Try to trigger result calculation
    try {
      await supabase.functions.invoke('determine-game-results');
    } catch (error) {
      console.log('Result calculation will happen later');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) return null;

  const isCreator = game.creator_id === userId;
  const userParticipation = game.participants.find(p => p.user_id === userId);
  const confirmedCount = game.participants.filter(p => p.status === 'Confirmado').length;
  const allStatsSubmitted = game.participants
    .filter(p => p.status === 'Confirmado')
    .every(p => p.stats_submitted);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/games')}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">DETALHES DO JOGO</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Game Info Card */}
        <section className="fifa-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
              {game.game_type}
            </span>
            {game.status === 'Finalizado' && (
              <span className="text-xs bg-destructive/20 text-destructive px-3 py-1 rounded-full font-medium">
                Finalizado
              </span>
            )}
            {isCreator && (
              <span className="text-xs bg-surface text-muted-foreground px-3 py-1 rounded-full">
                Organizador
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">{getWeekdayLabel(game.weekday)}</span>
                <p className="text-xs text-muted-foreground">
                  Próxima: {formatNextOccurrence(game.weekday, game.time)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">{game.time.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">{game.location}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {confirmedCount}/{game.max_players} confirmados
              </span>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Organizado por</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                {game.creator.avatar_url ? (
                  <img
                    src={game.creator.avatar_url}
                    alt={game.creator.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {game.creator.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">{game.creator.name}</p>
                <p className="text-xs text-muted-foreground">{game.creator.position}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Organizer Actions */}
        {isCreator && game.status !== 'Finalizado' && (
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Ações do Organizador
            </h3>
            <div className="flex gap-3">
              <Button
                variant="sport"
                className="flex-1"
                onClick={shuffleTeams}
              >
                <Shuffle className="h-5 w-5 mr-2" />
                Sortear Times
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={shareInvite}
              >
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar
              </Button>
            </div>
            <Button
              variant="destructive"
              className="w-full mt-3"
              onClick={handleEndGame}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Flag className="h-5 w-5 mr-2" />
                  Encerrar Partida
                </>
              )}
            </Button>
          </section>
        )}

        {/* Team Draw Result */}
        {showTeamDraw && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider">
                Times Sorteados
              </h3>
              <button
                onClick={() => setShowTeamDraw(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TeamDrawResult
              teamA={teamA}
              teamB={teamB}
              onReshuffle={shuffleTeams}
            />
          </section>
        )}

        {/* Post-Game Section - Shown when game is finished */}
        {game.status === 'Finalizado' && (
          <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {/* Organizer: Stats Form (if not all submitted) */}
            {isCreator && !allStatsSubmitted && (
              <>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Registrar Estatísticas
                </h3>
                <OrganizerStatsForm
                  gameId={game.id}
                  participants={game.participants}
                  onSubmit={handleDataRefresh}
                />
              </>
            )}

            {/* Players: Voting (if stats submitted) */}
            {!isCreator && allStatsSubmitted && userParticipation?.status === 'Confirmado' && (
              <>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Votação
                </h3>
                <PlayerVoting
                  gameId={game.id}
                  participants={game.participants}
                  currentUserId={userId!}
                  onVoteSubmitted={handleDataRefresh}
                />
              </>
            )}

            {/* Show waiting message for players while organizer fills stats */}
            {!isCreator && !allStatsSubmitted && userParticipation?.status === 'Confirmado' && (
              <div className="fifa-card p-5 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <h3 className="font-display text-lg tracking-wider text-primary">
                  AGUARDANDO ORGANIZADOR
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  O organizador está registrando as estatísticas da partida
                </p>
              </div>
            )}

            {/* Game Summary (when results are determined) */}
            {game.results_determined && (
              <>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3 mt-6">
                  Resumo da Partida
                </h3>
                <GameSummary
                  gameId={game.id}
                  participants={game.participants}
                  mvpId={game.mvp_id}
                  bestDefenderId={game.best_defender_id}
                />
              </>
            )}
          </section>
        )}

        {/* Actions for non-creator participants */}
        {userParticipation && !isCreator && game.status !== 'Finalizado' && (
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex gap-3">
              {userParticipation.status === 'Pendente' && (
                <Button
                  variant="sport"
                  className="flex-1"
                  onClick={handleConfirmPresence}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar Presença
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLeaveGame}
                disabled={actionLoading}
              >
                <UserMinus className="h-5 w-5 mr-2" />
                Sair do Jogo
              </Button>
            </div>
          </section>
        )}

        {/* Players List */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Jogadores ({confirmedCount}/{game.max_players})
          </h3>

          <div className="space-y-2">
            {game.participants
              .sort((a, b) => {
                const order = { Confirmado: 0, Pendente: 1, Recusado: 2 };
                return (order[a.status as keyof typeof order] || 2) - (order[b.status as keyof typeof order] || 2);
              })
              .map((participant) => (
                <div
                  key={participant.id}
                  className="fifa-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border-2 border-border flex items-center justify-center">
                      {participant.profile.avatar_url ? (
                        <img
                          src={participant.profile.avatar_url}
                          alt={participant.profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {participant.profile.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{participant.profile.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{participant.profile.position}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">
                          {participant.profile.overall_rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCreator && participant.user_id !== userId && game.status !== 'Finalizado' && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.user_id, participant.profile.name)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover jogador"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {getStatusIcon(participant.status || 'Pendente')}
                    <span className={`text-xs ${getStatusColor(participant.status || 'Pendente')}`}>
                      {participant.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {game.participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhum jogador confirmado ainda</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default GameDetails;
