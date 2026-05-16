import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TeamDrawResult from './TeamDrawResult';
import GameSummary from './GameSummary';
import AddPlayerDialog from './AddPlayerDialog';
import PlayerStatsForm from './PlayerStatsForm';
import MatchVoting from './MatchVoting';
import PlayerRatingsForm from './PlayerRatingsForm';
import PaymentBadge from './PaymentBadge';
import FinancialSummary from './FinancialSummary';
import ProFeatureGate from './ProFeatureGate';
import { useSubscription } from '@/hooks/useSubscription';
import { getMatchPhase } from '@/lib/matchStatus';
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
  MessageCircle,
  ChevronDown,
  MoreVertical,
  Bell,
  Trophy,
  ListChecks,
  Lock,
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
  const { hasAccess } = useSubscription();
  const [actionLoading, setActionLoading] = useState(false);
  const [showTeamDraw, setShowTeamDraw] = useState(false);
  const [teamA, setTeamA] = useState<MatchParticipant[]>([]);
  const [teamB, setTeamB] = useState<MatchParticipant[]>([]);
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);
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
      </div>
    );
  }

  const phase = getMatchPhase(match.status, match.open_for_confirmation);
  const matchDate = new Date(match.match_date + 'T00:00:00');
  const userParticipation = participants.find(p => p.user_id === userId);
  const confirmedParticipants = participants.filter(p => p.status === 'Confirmado');
  const waitlistParticipants = participants.filter(p => p.status === 'Lista de Espera');
  const confirmedCount = confirmedParticipants.length;
  const waitlistCount = waitlistParticipants.length;
  const paidCount = confirmedParticipants.filter(p => p.paid).length;
  const userSubmittedStats = userParticipation?.stats_submitted ?? false;
  const slotsFull = confirmedCount === pelada.max_players;
  const progressPct = Math.min((confirmedCount / pelada.max_players) * 100, 100);

  const isVotingOpen = match.ended_at
    ? new Date().getTime() - new Date(match.ended_at).getTime() < 48 * 60 * 60 * 1000
    : false;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado': return <CheckCircle className="h-4 w-4 text-lime" />;
      case 'Lista de Espera': return <AlertCircle className="h-4 w-4 text-sky-400" />;
      case 'Pendente': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'Recusado': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado': return 'text-lime';
      case 'Lista de Espera': return 'text-sky-400';
      case 'Pendente': return 'text-warning';
      case 'Recusado': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const updateStatus = async (newStatus: string, extra: Record<string, any> = {}) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('matches')
      .update({ status: newStatus as any, ...extra })
      .eq('id', match.id);
    setActionLoading(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a partida', variant: 'destructive' });
      return false;
    }
    await onRefresh();
    return true;
  };

  // === Phase transitions ===
  const handleOpenConfirmations = async () => {
    const ok = await updateStatus('confirmacoes_abertas', { open_for_confirmation: true });
    if (ok) toast({ title: 'Confirmações liberadas!' });
  };

  const handleDrawTeams = async () => {
    const ok = await updateStatus('times_sorteados');
    if (ok) {
      toast({ title: 'Times sorteados!' });
      navigate(`/team-draw/${match.id}`);
    }
  };

  const handleStartMatch = async () => {
    const ok = await updateStatus('em_andamento', { started_at: new Date().toISOString() });
    if (ok) toast({ title: 'Partida iniciada' });
  };

  const handleEndMatch = async () => {
    setShowEndMatchDialog(false);
    const ok = await updateStatus('encerrada', { ended_at: new Date().toISOString() });
    if (ok) toast({ title: 'Partida encerrada!', description: 'Registre as estatísticas dos jogadores' });
  };

  // === Other actions ===
  const handleConfirmPresence = async () => {
    if (!userId) return;
    setActionLoading(true);
    const newStatus = slotsFull ? 'Lista de Espera' : 'Confirmado';
    const op = userParticipation
      ? supabase.from('match_participants').update({ status: newStatus }).eq('id', userParticipation.id)
      : supabase.from('match_participants').insert({ match_id: match.id, user_id: userId, status: newStatus });
    const { error } = await op;
    setActionLoading(false);
    if (error) toast({ title: 'Erro', description: 'Não foi possível confirmar presença', variant: 'destructive' });
    else { toast({ title: slotsFull ? 'Você está na lista de espera' : 'Presença confirmada!' }); await onRefresh(); }
  };

  const handleCancelPresence = async () => {
    if (!userId || !userParticipation) return;
    setActionLoading(true);
    const { error } = await supabase.from('match_participants').delete().eq('id', userParticipation.id);
    setActionLoading(false);
    if (error) toast({ title: 'Erro', description: 'Não foi possível cancelar', variant: 'destructive' });
    else { toast({ title: 'Presença cancelada' }); await onRefresh(); }
  };

  const handleTogglePaid = async (participantId: string, currentPaid: boolean) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('match_participants').update({ paid: !currentPaid }).eq('id', participantId);
    if (error) toast({ title: 'Erro', variant: 'destructive' });
    else { toast({ title: !currentPaid ? 'Pagamento confirmado' : 'Pagamento removido' }); await onRefresh(); }
  };

  const handleRemoveParticipant = async () => {
    if (!isAdmin || !participantToRemove) return;
    const { error } = await supabase.from('match_participants').delete().eq('id', participantToRemove);
    setShowRemoveDialog(false);
    setParticipantToRemove(null);
    if (error) toast({ title: 'Erro', variant: 'destructive' });
    else { toast({ title: 'Jogador removido' }); await onRefresh(); }
  };

  const buildShareMessage = () => {
    const confirmedNames = confirmedParticipants.map(p => `• ${p.profile?.name || p.guest_name}`).join('\n');
    const dateStr = matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const rsvpUrl = `https://${projectId}.supabase.co/functions/v1/match-preview/${match.id}`;
    return `⚽ *${pelada.name}*
📅 ${dateStr}
🕐 ${match.match_time.slice(0, 5)}
📍 ${match.location || pelada.location}

✅ *CONFIRMADOS (${confirmedCount}/${pelada.max_players})*
${confirmedNames || '—'}

${slotsFull ? '🔴 LOTADO!' : `🟢 ${pelada.max_players - confirmedCount} vagas restantes`}

👉 Confirme sua presença:
${rsvpUrl}`;
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(buildShareMessage())}`;
    window.open(url, '_blank');
  };

  const sendReminder = () => {
    const dateStr = matchDate.toLocaleDateString('pt-BR');
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const rsvpUrl = `https://${projectId}.supabase.co/functions/v1/match-preview/${match.id}`;
    const msg = `⚠️ *LEMBRETE DE PARTIDA*

⚽ ${pelada.name}
📅 ${dateStr}
🕐 ${match.match_time.slice(0, 5)}
📍 ${match.location || pelada.location}

👥 ${confirmedCount}/${pelada.max_players} confirmados

👉 ${rsvpUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shuffleTeams = () => {
    const confirmed = participants.filter(p => p.status === 'Confirmado');
    if (confirmed.length < 2) {
      toast({ title: 'Aviso', description: 'Mínimo 2 jogadores confirmados', variant: 'destructive' });
      return;
    }
    const sorted = [...confirmed].sort((a, b) => (b.profile?.overall_rating || 50) - (a.profile?.overall_rating || 50));
    const a: MatchParticipant[] = [], b: MatchParticipant[] = [];
    sorted.forEach((p, i) => (i % 2 === 0 ? a : b).push(p));
    setTeamA(a); setTeamB(b); setShowTeamDraw(true);
  };

  // === Render: primary + secondary actions per phase (admin) ===
  const renderAdminActions = () => {
    if (!isAdmin) return null;

    if (phase === 'criada') {
      return (
        <div className="space-y-2">
          <Button variant="sport" size="lg" className="w-full h-14 text-base font-semibold" onClick={handleOpenConfirmations} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Unlock className="h-5 w-5 mr-2" />Liberar confirmações</>}
          </Button>
          <Button variant="outline" size="lg" className="w-full h-12" onClick={shareOnWhatsApp}>
            <MessageCircle className="h-5 w-5 mr-2" />Convidar jogadores
          </Button>
        </div>
      );
    }

    if (phase === 'confirmacoes_abertas') {
      return (
        <div className="space-y-2">
          <Button variant="sport" size="lg" className="w-full h-14 text-base font-semibold" onClick={shareOnWhatsApp}>
            <MessageCircle className="h-5 w-5 mr-2" />Compartilhar no WhatsApp
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12"
            onClick={handleDrawTeams}
            disabled={confirmedCount < 4 || actionLoading}
          >
            <Shuffle className="h-5 w-5 mr-2" />
            Sortear Times {confirmedCount < 4 && <span className="ml-2 text-xs text-muted-foreground">(mín. 4)</span>}
          </Button>
        </div>
      );
    }

    if (phase === 'times_sorteados') {
      return (
        <div className="space-y-2">
          <Button variant="sport" size="lg" className="w-full h-14 text-base font-semibold" onClick={() => navigate(`/team-draw/${match.id}`)}>
            <ListChecks className="h-5 w-5 mr-2" />Ver times
          </Button>
          <Button variant="outline" size="lg" className="w-full h-12" onClick={handleStartMatch} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Flag className="h-5 w-5 mr-2" />Iniciar partida</>}
          </Button>
        </div>
      );
    }

    if (phase === 'em_andamento') {
      return (
        <Button variant="sport" size="lg" className="w-full h-14 text-base font-semibold" onClick={() => navigate(`/team-draw/${match.id}`)}>
          <ListChecks className="h-5 w-5 mr-2" />Registrar gols
        </Button>
      );
    }

    // encerrada
    const canVote = hasAccess('mvp_voting');
    return (
      <div className="space-y-2">
        <Button
          variant="sport"
          size="lg"
          className="w-full h-14 text-base font-semibold"
          onClick={() => {
            if (!canVote) {
              toast({ title: 'Recurso Pro', description: 'A votação de MVP é exclusiva para assinantes Pro.' });
              return;
            }
            const el = document.getElementById('mvp-voting');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else toast({ title: 'Votação indisponível', description: 'A janela de votação expirou ou ainda não está aberta.' });
          }}
        >
          {canVote ? <Trophy className="h-5 w-5 mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
          Votar MVP
        </Button>
        <Button variant="outline" size="lg" className="w-full h-12" onClick={() => {
          const el = document.getElementById('match-summary');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else toast({ title: 'Resumo ainda não disponível', description: 'Aguardando registro de estatísticas.' });
        }}>
          <ListChecks className="h-5 w-5 mr-2" />Ver resumo
        </Button>
      </div>
    );
  };

  const renderOverflowMenu = () => {
    if (!isAdmin) return null;
    const showEnd = phase !== 'encerrada' && phase !== 'criada';
    const showReminder = phase === 'confirmacoes_abertas' || phase === 'times_sorteados' || phase === 'em_andamento';
    const showFin = !!pelada.price_per_game && pelada.price_per_game > 0 && confirmedCount > 0 && phase !== 'encerrada';
    if (!showEnd && !showReminder && !showFin) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showReminder && (
            <DropdownMenuItem onClick={sendReminder}>
              <Bell className="h-4 w-4 mr-2" />Lembrete WhatsApp
            </DropdownMenuItem>
          )}
          {showFin && (
            <DropdownMenuItem onClick={() => setShowFinancial(v => !v)}>
              <ListChecks className="h-4 w-4 mr-2" />Resumo financeiro
            </DropdownMenuItem>
          )}
          {showEnd && (
            <>
              {(showReminder || showFin) && <DropdownMenuSeparator />}
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowEndMatchDialog(true)}>
                <Flag className="h-4 w-4 mr-2" />Encerrar partida
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Non-admin actions (presence) — only when confirmations are open
  const renderMemberActions = () => {
    if (isAdmin) return null;
    if (phase !== 'confirmacoes_abertas') {
      if (phase === 'criada') {
        return (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Aguardando o admin liberar as confirmações</span>
          </div>
        );
      }
      return null;
    }
    const isCancelable = userParticipation && (userParticipation.status === 'Confirmado' || userParticipation.status === 'Lista de Espera');
    return isCancelable ? (
      <Button variant="outline" size="lg" className="w-full h-12" onClick={handleCancelPresence} disabled={actionLoading}>
        <XCircle className="h-5 w-5 mr-2" />Cancelar presença
      </Button>
    ) : (
      <Button variant="sport" size="lg" className="w-full h-14 text-base font-semibold" onClick={handleConfirmPresence} disabled={actionLoading}>
        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : slotsFull ? <><AlertCircle className="h-5 w-5 mr-2" />Entrar na lista de espera</> : <><CheckCircle className="h-5 w-5 mr-2" />Confirmar presença</>}
      </Button>
    );
  };

  const phaseLabel: Record<string, { text: string; cls: string }> = {
    criada: { text: 'Criada', cls: 'bg-muted text-muted-foreground' },
    confirmacoes_abertas: { text: 'Confirmações abertas', cls: 'bg-primary/20 text-primary' },
    times_sorteados: { text: 'Times sorteados', cls: 'bg-amber-500/20 text-amber-400' },
    em_andamento: { text: 'Em andamento', cls: 'bg-sky-500/20 text-sky-400' },
    encerrada: { text: 'Encerrada', cls: 'bg-destructive/20 text-destructive' },
  };

  return (
    <div className="space-y-4">
      {/* === Header card === */}
      <div className="fifa-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />{match.match_time.slice(0, 5)}
              </p>
            </div>
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold ${phaseLabel[phase].cls}`}>
            {phaseLabel[phase].text}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{match.location || pelada.location}</span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span><span className="text-foreground font-semibold">{confirmedCount}</span>/{pelada.max_players} confirmados</span>
              {waitlistCount > 0 && <span className="text-xs text-sky-400">(+{waitlistCount} espera)</span>}
            </div>
            {slotsFull && <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">LOTADO</span>}
          </div>
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-lime transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* User status (non-admin) */}
        {userParticipation && !isAdmin && (
          <div className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg">
            {getStatusIcon(userParticipation.status)}
            <span className={`text-sm font-medium ${getStatusColor(userParticipation.status)}`}>
              {userParticipation.status === 'Lista de Espera'
                ? `Você está na lista de espera (posição ${waitlistParticipants.findIndex(p => p.user_id === userId) + 1})`
                : `Você está ${userParticipation.status.toLowerCase()}`}
            </span>
          </div>
        )}

        {/* Primary + secondary actions + overflow */}
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-2">
            {renderAdminActions()}
            {renderMemberActions()}
          </div>
          {renderOverflowMenu()}
        </div>

        {/* Admin: add guest in active phases */}
        {isAdmin && (phase === 'criada' || phase === 'confirmacoes_abertas') && (
          <AddPlayerDialog matchId={match.id} onPlayerAdded={onRefresh} />
        )}
      </div>

      {/* Optional financial summary (admin toggle, only pre-encerrada) */}
      {isAdmin && showFinancial && pelada.price_per_game && pelada.price_per_game > 0 && phase !== 'encerrada' && (
        <FinancialSummary pricePerGame={pelada.price_per_game} confirmedCount={confirmedCount} paidCount={paidCount} />
      )}

      {/* Team draw result preview (local shuffle) */}
      {showTeamDraw && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-muted-foreground uppercase tracking-wider">Times Sorteados</h4>
            <button onClick={() => setShowTeamDraw(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <TeamDrawResult teamA={teamA as any} teamB={teamB as any} onReshuffle={shuffleTeams} />
        </div>
      )}

      {/* In-progress: MVP gated by Pro */}
      {phase === 'em_andamento' && (
        <ProFeatureGate feature="mvp_voting" fallbackTitle="Votação MVP">
          <div className="fifa-card p-4 text-center text-sm text-muted-foreground">
            A votação de MVP estará disponível ao encerrar a partida.
          </div>
        </ProFeatureGate>
      )}

      {/* === Post-game === */}
      {phase === 'encerrada' && (
        <div className="space-y-4">
          {userParticipation?.status === 'Confirmado' && !userSubmittedStats && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Registrar Suas Estatísticas</h4>
              <PlayerStatsForm
                participantId={userParticipation.id}
                currentGoals={userParticipation.goals}
                currentAssists={userParticipation.assists}
                onSubmit={onRefresh}
              />
            </div>
          )}
          {userParticipation?.status === 'Confirmado' && isVotingOpen && (
            <div id="mvp-voting">
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Votação MVP</h4>
              <ProFeatureGate feature="mvp_voting" fallbackTitle="Votação MVP">
                <MatchVoting
                  matchId={match.id}
                  participants={participants}
                  currentUserId={userId!}
                  matchEndedAt={match.ended_at!}
                  onVoteSubmitted={onRefresh}
                />
              </ProFeatureGate>
            </div>
          )}
          {userParticipation?.status === 'Confirmado' && isVotingOpen && userId && (
            <div>
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Avaliar Jogadores (0-10)</h4>
              <PlayerRatingsForm
                matchId={match.id}
                currentUserId={userId}
                players={participants.filter(p => p.user_id && p.status === 'Confirmado').map(p => ({
                  id: p.user_id!,
                  name: p.profile?.name || 'Jogador',
                  avatarUrl: p.profile?.avatar_url || null,
                }))}
                onSubmit={onRefresh}
              />
            </div>
          )}
          {match.results_determined && (
            <div id="match-summary">
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Resumo da Partida</h4>
              <GameSummary matchId={match.id} participants={participants as any} mvpId={match.mvp_id} bestDefenderId={match.best_defender_id} />
            </div>
          )}
          {pelada.price_per_game && pelada.price_per_game > 0 && confirmedCount > 0 && (
            <FinancialSummary pricePerGame={pelada.price_per_game} confirmedCount={confirmedCount} paidCount={paidCount} />
          )}
        </div>
      )}

      {/* Players List */}
      <div>
        <h4 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Jogadores ({confirmedCount}/{pelada.max_players})
        </h4>
        <div className="space-y-2">
          {participants
            .sort((a, b) => {
              const order = { Confirmado: 0, 'Lista de Espera': 1, Pendente: 2, Recusado: 3 } as any;
              return (order[a.status] ?? 4) - (order[b.status] ?? 4);
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
                      {avatar ? <img src={avatar} alt={name || ''} className="w-full h-full rounded-full object-cover" /> : <span className="text-sm font-bold text-primary">{name?.charAt(0) || '?'}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{name}</p>
                        {isGuest && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Aleatório</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{position}</span><span>•</span><span className="text-primary font-bold">{rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showPayment && (
                      <PaymentBadge paid={participant.paid} price={pelada.price_per_game || undefined} onClick={isAdmin ? () => handleTogglePaid(participant.id, participant.paid) : undefined} interactive={isAdmin} />
                    )}
                    {!showPayment && getStatusIcon(participant.status)}
                    {!showPayment && <span className={`text-xs ${getStatusColor(participant.status)}`}>{participant.status}</span>}
                    {isAdmin && phase !== 'encerrada' && (
                      <button onClick={() => { setParticipantToRemove(participant.id); setShowRemoveDialog(true); }} className="p-1 text-destructive/60 hover:text-destructive" title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          {participants.length > PARTICIPANTS_DISPLAY_LIMIT && (
            <button onClick={() => navigate(`/match/${match.id}/participants`)} className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2 fifa-card">
              <ChevronDown className="h-4 w-4" />Ver todos ({participants.length} jogadores)
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

      <ConfirmDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog} title="Encerrar partida?" description="Após encerrar, você poderá registrar as estatísticas dos jogadores." confirmText="Encerrar" onConfirm={handleEndMatch} variant="destructive" />
      <ConfirmDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog} title="Remover jogador?" description="Tem certeza que deseja remover este jogador da partida?" confirmText="Remover" onConfirm={handleRemoveParticipant} variant="destructive" />
    </div>
  );
};

export default UpcomingMatch;
