import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import TeamDrawResult from './TeamDrawResult';
import GameSummary from './GameSummary';
import AddPlayerDialog from './AddPlayerDialog';
import PlayerStatsForm from './PlayerStatsForm';
import MatchVoting from './MatchVoting';
import PlayerRatingsForm from './PlayerRatingsForm';
import MatchReminderButton from './MatchReminderButton';
import PaymentBadge from './PaymentBadge';
import FinancialSummary from './FinancialSummary';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shuffle,
  Flag,
  X,
  Trash2,
  Unlock,
  Lock,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';

const PARTICIPANTS_DISPLAY_LIMIT = 3;

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
  open_for_confirmation: boolean;
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
  paid: boolean;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
    overall_rating: number;
  };
};

type Pelada = {
  id: string;
  name: string;
  location: string;
  weekday: number;
  time: string;
  game_type: string;
  max_players: number;
  price_per_game: number | null;
};

interface UpcomingMatchProps {
  match: Match | null;
  participants: MatchParticipant[];
  pelada: Pelada;
  userId: string | null;
  isAdmin: boolean;
  onRefresh: () => Promise<void>;
}

const UpcomingMatch = ({
  match,
  participants,
  pelada,
  userId,
  isAdmin,
  onRefresh,
}: UpcomingMatchProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [showTeamDraw, setShowTeamDraw] = useState(false);
  const [teamA, setTeamA] = useState<MatchParticipant[]>([]);
  const [teamB, setTeamB] = useState<MatchParticipant[]>([]);
  
  // Dialog states
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);

  // No match scheduled
  if (!match) {
    return (
      <div className="fifa-card p-5 text-center">
        <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h4 className="font-display text-lg tracking-wider text-muted-foreground">
          SEM PARTIDA AGENDADA
        </h4>
        <p className="text-sm text-muted-foreground mt-2">
          Nenhuma partida marcada para os próximos dias.
        </p>
        {isAdmin && (
          <Button variant="sport" className="mt-4" onClick={() => {/* TODO: Create match */}}>
            Agendar Partida
          </Button>
        )}
      </div>
    );
  }

  const matchDate = new Date(match.match_date + 'T00:00:00');
  const userParticipation = participants.find(p => p.user_id === userId);
  const confirmedParticipants = participants.filter(p => p.status === 'Confirmado');
  const waitlistParticipants = participants.filter(p => p.status === 'Lista de Espera');
  const confirmedCount = confirmedParticipants.length;
  const waitlistCount = waitlistParticipants.length;
  const paidCount = confirmedParticipants.filter(p => p.paid).length;
  const userSubmittedStats = userParticipation?.stats_submitted ?? false;
  
  // Check if voting is still open (48h after match ended)
  const isVotingOpen = match.ended_at 
    ? new Date().getTime() - new Date(match.ended_at).getTime() < 48 * 60 * 60 * 1000 
    : false;
  
  // Check if confirmed slots are full (first come first served)
  const isFull = confirmedCount >= pelada.max_players;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <CheckCircle className="h-4 w-4 text-lime" />;
      case 'Lista de Espera':
        return <AlertCircle className="h-4 w-4 text-sky-400" />;
      case 'Pendente':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'Recusado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'text-lime';
      case 'Lista de Espera':
        return 'text-sky-400';
      case 'Pendente':
        return 'text-warning';
      case 'Recusado':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleConfirmPresence = async () => {
    if (!userId || !match) return;
    setActionLoading(true);

    // Determine status based on capacity
    const newStatus = isFull ? 'Lista de Espera' : 'Confirmado';
    const successMessage = isFull ? 'Você está na lista de espera' : 'Presença confirmada!';

    if (userParticipation) {
      // Update existing participation
      const { error } = await supabase
        .from('match_participants')
        .update({ status: newStatus })
        .eq('id', userParticipation.id);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível confirmar presença', variant: 'destructive' });
      } else {
        toast({ title: 'Sucesso', description: successMessage });
        await onRefresh();
      }
    } else {
      // Create new participation
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: match.id,
          user_id: userId,
          status: newStatus,
        });

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível confirmar presença', variant: 'destructive' });
      } else {
        toast({ title: 'Sucesso', description: successMessage });
        await onRefresh();
      }
    }

    setActionLoading(false);
  };

  const handleCancelPresence = async () => {
    if (!userId || !userParticipation) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('id', userParticipation.id);

    setActionLoading(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível cancelar presença', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Presença cancelada' });
      await onRefresh();
    }
  };

  const getPlayerRating = (participant: MatchParticipant) => {
    if (!participant.user_id) return 50;
    return participant.profile?.overall_rating || 50;
  };

  const shuffleTeams = () => {
    const confirmed = participants.filter(p => p.status === 'Confirmado');
    
    if (confirmed.length < 2) {
      toast({
        title: 'Aviso',
        description: 'É necessário pelo menos 2 jogadores confirmados',
        variant: 'destructive',
      });
      return;
    }

    const sorted = [...confirmed].sort((a, b) => getPlayerRating(b) - getPlayerRating(a));
    const newTeamA: MatchParticipant[] = [];
    const newTeamB: MatchParticipant[] = [];
    
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

  const handleEndMatch = async () => {
    if (!match || !isAdmin) return;

    setActionLoading(true);

    const { error } = await supabase
      .from('matches')
      .update({ 
        status: 'finished',
        ended_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    setActionLoading(false);
    setShowEndMatchDialog(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível encerrar a partida', variant: 'destructive' });
    } else {
      toast({ title: 'Partida encerrada!', description: 'Registre as estatísticas dos jogadores' });
      await onRefresh();
    }
  };

  const handleDataRefresh = async () => {
    await onRefresh();
  };

  const handleTogglePaid = async (participantId: string, currentPaid: boolean) => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from('match_participants')
      .update({ paid: !currentPaid })
      .eq('id', participantId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar pagamento', variant: 'destructive' });
    } else {
      toast({ title: !currentPaid ? 'Pagamento confirmado' : 'Pagamento removido' });
      await onRefresh();
    }
  };

  const handleRemoveParticipant = async () => {
    if (!isAdmin || !participantToRemove) return;

    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('id', participantToRemove);

    setShowRemoveDialog(false);
    setParticipantToRemove(null);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o jogador', variant: 'destructive' });
    } else {
      toast({ title: 'Jogador removido' });
      await onRefresh();
    }
  };

  const openRemoveDialog = (participantId: string) => {
    setParticipantToRemove(participantId);
    setShowRemoveDialog(true);
  };

  const handleToggleConfirmations = async () => {
    if (!match || !isAdmin) return;
    setActionLoading(true);

    const newValue = !match.open_for_confirmation;
    const { error } = await supabase
      .from('matches')
      .update({ open_for_confirmation: newValue })
      .eq('id', match.id);

    setActionLoading(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' });
    } else {
      toast({ title: newValue ? 'Confirmações liberadas' : 'Confirmações bloqueadas' });
      await onRefresh();
    }
  };

  // Adapt participants for legacy components
  const adaptedParticipants = participants.map(p => ({
    ...p,
    game_id: match.id, // Legacy compatibility
    profile: p.profile || {
      id: p.user_id || '',
      name: p.guest_name || 'Jogador',
      position: p.guest_position || 'Meia',
      avatar_url: null,
      overall_rating: 50,
      attack_rating: 50,
      defense_rating: 50,
      skill_rating: 50,
      strength_rating: 50,
      age: 25,
      dominant_foot: 'Destro',
      shirt_number: 10,
      phone: null,
      total_goals: 0,
      total_assists: 0,
      calibration_completed: false,
      created_at: '',
      preferred_game_type: null,
    },
  }));

  return (
    <div className="space-y-4">
      {/* Match Info Card */}
      <div className="fifa-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {match.match_time.slice(0, 5)}
              </p>
            </div>
          </div>
          {match.status === 'finished' && (
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
              Finalizado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          {match.location || pelada.location}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{confirmedCount}/{pelada.max_players} confirmados</span>
              {waitlistCount > 0 && (
                <span className="text-xs text-sky-400">
                  (+{waitlistCount} na espera)
                </span>
              )}
            </div>
            {isFull && (
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">
                LOTADO
              </span>
            )}
          </div>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-lime transition-all duration-500 ease-out"
              style={{ width: `${Math.min((confirmedCount / pelada.max_players) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* User Status */}
        {userParticipation && (
          <div className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg mb-4">
            {getStatusIcon(userParticipation.status)}
            <span className={`text-sm font-medium ${getStatusColor(userParticipation.status)}`}>
              {userParticipation.status === 'Lista de Espera' 
                ? `Você está na lista de espera (posição ${waitlistParticipants.findIndex(p => p.user_id === userId) + 1})`
                : `Você está ${userParticipation.status.toLowerCase()}`}
            </span>
          </div>
        )}

        {/* Confirmations closed message */}
        {!match.open_for_confirmation && match.status !== 'finished' && !isAdmin && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Confirmações ainda não liberadas pelo admin
            </span>
          </div>
        )}

        {/* User Actions */}
        {match.status !== 'finished' && match.open_for_confirmation && (
          <div className="flex gap-2">
            {(!userParticipation || (userParticipation.status !== 'Confirmado' && userParticipation.status !== 'Lista de Espera')) && (
              <Button
                variant="sport"
                className="flex-1"
                onClick={handleConfirmPresence}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isFull ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Entrar na Lista de Espera
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirmar Presença
                  </>
                )}
              </Button>
            )}
            {userParticipation && (userParticipation.status === 'Confirmado' || userParticipation.status === 'Lista de Espera') && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelPresence}
                disabled={actionLoading}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        )}

        {/* WhatsApp Share Button */}
        {confirmedCount > 0 && (
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => {
              const confirmedNames = confirmedParticipants
                .map(p => `• ${p.profile?.name || p.guest_name}`)
                .join('\n');

              const dateStr = matchDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              });

              const rsvpUrl = `${window.location.origin}/m/${match.id}`;
              const message = `⚽ *${pelada.name}*
📅 ${dateStr}
🕐 ${match.match_time.slice(0, 5)}
📍 ${match.location || pelada.location}

✅ *CONFIRMADOS (${confirmedCount}/${pelada.max_players})*
${confirmedNames}

${isFull ? '🔴 LOTADO!' : `🟢 ${pelada.max_players - confirmedCount} vagas restantes`}

👉 Confirme sua presença:
${rsvpUrl}`;

              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Compartilhar no WhatsApp
          </Button>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && match.status !== 'finished' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={match.open_for_confirmation ? 'outline' : 'sport'}
              onClick={handleToggleConfirmations}
              disabled={actionLoading}
            >
              {match.open_for_confirmation ? (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Bloquear
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5 mr-2" />
                  Liberar Partida
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = `/team-draw/${match.id}`}>
              <Shuffle className="h-5 w-5 mr-2" />
              Sortear Times
            </Button>
            <AddPlayerDialog
              matchId={match.id}
              onPlayerAdded={onRefresh}
            />
            <Button
              variant="destructive"
              onClick={() => setShowEndMatchDialog(true)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Flag className="h-5 w-5 mr-2" />
                  Encerrar
                </>
              )}
            </Button>
          </div>
          {/* Reminder Button for Admins */}
          <div className="flex gap-3">
            <MatchReminderButton
              pelada={pelada}
              match={match}
              confirmedCount={confirmedCount}
            />
          </div>
        </div>
      )}

      {/* Team Draw Result */}
      {showTeamDraw && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-muted-foreground uppercase tracking-wider">
              Times Sorteados
            </h4>
            <button
              onClick={() => setShowTeamDraw(false)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <TeamDrawResult
            teamA={teamA as any}
            teamB={teamB as any}
            onReshuffle={shuffleTeams}
          />
        </div>
      )}

      {/* Post-Game Section */}
      {match.status === 'finished' && (
        <div className="space-y-4">
          {/* User Stats Form - each user registers their own stats */}
          {userParticipation?.status === 'Confirmado' && !userSubmittedStats && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Registrar Suas Estatísticas
              </h4>
              <PlayerStatsForm
                participantId={userParticipation.id}
                currentGoals={userParticipation.goals}
                currentAssists={userParticipation.assists}
                onSubmit={handleDataRefresh}
              />
            </div>
          )}

          {/* MVP Voting - available for 48h after match ends */}
          {userParticipation?.status === 'Confirmado' && isVotingOpen && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Votação MVP
              </h4>
              <MatchVoting
                matchId={match.id}
                participants={participants}
                currentUserId={userId!}
                matchEndedAt={match.ended_at!}
                onVoteSubmitted={handleDataRefresh}
              />
            </div>
          )}

          {/* Player Ratings - available for 48h after match ends */}
          {userParticipation?.status === 'Confirmado' && isVotingOpen && userId && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Avaliar Jogadores (0-10)
              </h4>
              <PlayerRatingsForm
                matchId={match.id}
                currentUserId={userId}
                players={participants
                  .filter(p => p.user_id && p.status === 'Confirmado')
                  .map(p => ({
                    id: p.user_id!,
                    name: p.profile?.name || 'Jogador',
                    avatarUrl: p.profile?.avatar_url || null,
                  }))}
                onSubmit={handleDataRefresh}
              />
            </div>
          )}

          {match.results_determined && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Resumo da Partida
              </h4>
              <GameSummary
                matchId={match.id}
                participants={participants as any}
                mvpId={match.mvp_id}
                bestDefenderId={match.best_defender_id}
              />
            </div>
          )}
        </div>
      )}

      {/* Financial Summary - only show if price is set and there are confirmed players */}
      {pelada.price_per_game && pelada.price_per_game > 0 && confirmedCount > 0 && (
        <FinancialSummary
          pricePerGame={pelada.price_per_game}
          confirmedCount={confirmedCount}
          paidCount={paidCount}
        />
      )}

      {/* Players List */}
      <div>
        <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Jogadores ({confirmedCount}/{pelada.max_players})
        </h4>
        <div className="space-y-2">
          {participants
            .sort((a, b) => {
              const order = { Confirmado: 0, Pendente: 1, Recusado: 2 };
              return (order[a.status as keyof typeof order] || 2) - (order[b.status as keyof typeof order] || 2);
            })
            .slice(0, PARTICIPANTS_DISPLAY_LIMIT)
            .map((participant) => {
              const isGuest = !participant.user_id;
              const name = isGuest ? participant.guest_name : participant.profile?.name;
              const position = isGuest ? participant.guest_position : participant.profile?.position;
              const avatar = isGuest ? null : participant.profile?.avatar_url;
              const rating = isGuest ? 50 : participant.profile?.overall_rating;
              const showPayment = pelada.price_per_game && pelada.price_per_game > 0 && participant.status === 'Confirmado';

              return (
                <div key={participant.id} className="fifa-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border-2 border-border flex items-center justify-center">
                      {avatar ? (
                        <img src={avatar} alt={name || ''} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{name}</p>
                        {isGuest && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Aleatório
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{position}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">{rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Payment Badge - only for confirmed players when price is set */}
                    {showPayment && (
                      <PaymentBadge
                        paid={participant.paid}
                        price={pelada.price_per_game || undefined}
                        onClick={isAdmin ? () => handleTogglePaid(participant.id, participant.paid) : undefined}
                        interactive={isAdmin}
                      />
                    )}
                    {!showPayment && getStatusIcon(participant.status)}
                    {!showPayment && (
                      <span className={`text-xs ${getStatusColor(participant.status)}`}>
                        {participant.status}
                      </span>
                    )}
                    {isAdmin && match.status !== 'finished' && (
                      <button
                        onClick={() => openRemoveDialog(participant.id)}
                        className="p-1 text-destructive/60 hover:text-destructive transition-colors"
                        title="Remover jogador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {participants.length > PARTICIPANTS_DISPLAY_LIMIT && (
            <button
              onClick={() => navigate(`/match/${match.id}/participants`)}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2 fifa-card"
            >
              <ChevronDown className="h-4 w-4" />
              Ver todos ({participants.length} jogadores)
            </button>
          )}

          {participants.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum jogador confirmado ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showEndMatchDialog}
        onOpenChange={setShowEndMatchDialog}
        title="Encerrar partida?"
        description="Após encerrar, você poderá registrar as estatísticas dos jogadores."
        confirmText="Encerrar"
        onConfirm={handleEndMatch}
        variant="destructive"
      />

      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remover jogador?"
        description="Tem certeza que deseja remover este jogador da partida?"
        confirmText="Remover"
        onConfirm={handleRemoveParticipant}
        variant="destructive"
      />
    </div>
  );
};

export default UpcomingMatch;
