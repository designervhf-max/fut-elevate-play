import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MatchTimer from '@/components/MatchTimer';
import StatCounter from '@/components/StatCounter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PositionBadge from '@/components/PositionBadge';
import {
  ChevronLeft,
  Flag,
  Loader2,
  Target,
  Sparkles,
  Shield,
  Users,
} from 'lucide-react';

type Participant = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_position: string | null;
  goals: number;
  assists: number;
  saves: number;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
  };
};

type Match = {
  id: string;
  pelada_id: string;
  match_date: string;
  match_time: string;
  status: string;
  started_at: string | null;
};

type Pelada = {
  id: string;
  name: string;
};

const MatchLive = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  // Local stats state for real-time updates
  const [localStats, setLocalStats] = useState<Record<string, { goals: number; assists: number; saves: number }>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!matchId) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError || !matchData) {
        toast({ title: 'Erro', description: 'Partida não encontrada', variant: 'destructive' });
        navigate(-1);
        return;
      }

      setMatch(matchData as Match);

      // Calculate initial time if match was already started
      if (matchData.started_at) {
        const startTime = new Date(matchData.started_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        setInitialTime(elapsedSeconds);
        setTimerRunning(matchData.status === 'in_progress');
      }

      // Fetch pelada
      const { data: peladaData } = await supabase
        .from('peladas')
        .select('id, name')
        .eq('id', matchData.pelada_id)
        .single();

      if (peladaData) {
        setPelada(peladaData);
      }

      // Fetch confirmed participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select('id, user_id, guest_name, guest_position, goals, assists, saves')
        .eq('match_id', matchId)
        .eq('status', 'Confirmado');

      if (participantsData) {
        // Fetch profiles for user participants
        const userIds = participantsData.filter(p => p.user_id).map(p => p.user_id!);
        let profilesMap: Record<string, Participant['profile']> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, position, avatar_url')
            .in('id', userIds);

          if (profiles) {
            profilesMap = profiles.reduce((acc, p) => {
              acc[p.id] = p;
              return acc;
            }, {} as typeof profilesMap);
          }
        }

        const enrichedParticipants = participantsData.map(p => ({
          ...p,
          goals: p.goals || 0,
          assists: p.assists || 0,
          saves: p.saves || 0,
          profile: p.user_id ? profilesMap[p.user_id] : undefined,
        }));

        setParticipants(enrichedParticipants);

        // Initialize local stats
        const stats: typeof localStats = {};
        enrichedParticipants.forEach(p => {
          stats[p.id] = {
            goals: p.goals,
            assists: p.assists,
            saves: p.saves,
          };
        });
        setLocalStats(stats);
      }

      setLoading(false);
    };

    fetchData();
  }, [matchId, navigate, toast]);

  const handleTimerStart = async () => {
    if (!match) return;

    // Update match status and started_at
    await supabase
      .from('matches')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    setTimerRunning(true);
  };

  const handleRunningChange = (running: boolean) => {
    if (running && !timerRunning) {
      handleTimerStart();
    }
    setTimerRunning(running);
  };

  const updateStat = (participantId: string, stat: 'goals' | 'assists' | 'saves', value: number) => {
    setLocalStats(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [stat]: value,
      },
    }));
  };

  const saveStats = async () => {
    setSaving(true);

    // Batch update all participants
    const updates = Object.entries(localStats).map(([participantId, stats]) =>
      supabase
        .from('match_participants')
        .update({
          goals: stats.goals,
          assists: stats.assists,
          saves: stats.saves,
        })
        .eq('id', participantId)
    );

    await Promise.all(updates);
    setSaving(false);
    toast({ title: 'Estatísticas salvas!' });
  };

  const handleEndMatch = async () => {
    if (!match) return;

    setSaving(true);

    // Save all stats first
    await saveStats();

    // Update match status
    await supabase
      .from('matches')
      .update({
        status: 'finished',
        ended_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    setSaving(false);
    setShowEndDialog(false);
    toast({ title: 'Partida encerrada!', description: 'Estatísticas salvas com sucesso' });
    navigate(`/pelada/${match.pelada_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match || !pelada) {
    return null;
  }

  const getName = (p: Participant) => p.guest_name || p.profile?.name || 'Jogador';
  const getPosition = (p: Participant) => p.guest_position || p.profile?.position || 'Meia';
  const getAvatar = (p: Participant) => p.profile?.avatar_url || null;
  const isGoalkeeper = (p: Participant) => getPosition(p) === 'Goleiro';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{pelada.name}</h1>
              <p className="text-xs text-muted-foreground">Partida ao Vivo</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={saveStats}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
        </div>
      </header>

      <main className="p-4 pb-28 space-y-6">
        {/* Timer Section */}
        <section className="animate-slide-up">
          <MatchTimer
            initialTime={initialTime}
            isRunning={timerRunning}
            onRunningChange={handleRunningChange}
          />
        </section>

        {/* Stats Legend */}
        <section className="animate-slide-up flex justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-lime" />
            <span>Gols</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Assists</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-sky-400" />
            <span>Defesas</span>
          </div>
        </section>

        {/* Players List */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Jogadores ({participants.length})
          </h3>

          <div className="space-y-3">
            {participants.map((participant) => {
              const stats = localStats[participant.id] || { goals: 0, assists: 0, saves: 0 };

              return (
                <div key={participant.id} className="fifa-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatar(participant) || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {getName(participant).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <PositionBadge
                        position={getPosition(participant)}
                        size="sm"
                        className="absolute -bottom-1 -right-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getName(participant)}</p>
                      <p className="text-xs text-muted-foreground">{getPosition(participant)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-around">
                    <StatCounter
                      value={stats.goals}
                      onChange={(v) => updateStat(participant.id, 'goals', v)}
                      icon={<Target className="h-4 w-4 text-lime" />}
                      label="Gols"
                    />
                    <StatCounter
                      value={stats.assists}
                      onChange={(v) => updateStat(participant.id, 'assists', v)}
                      icon={<Sparkles className="h-4 w-4 text-primary" />}
                      label="Assists"
                    />
                    {isGoalkeeper(participant) && (
                      <StatCounter
                        value={stats.saves}
                        onChange={(v) => updateStat(participant.id, 'saves', v)}
                        icon={<Shield className="h-4 w-4 text-sky-400" />}
                        label="Defesas"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => setShowEndDialog(true)}
          >
            <Flag className="h-5 w-5 mr-2" />
            Encerrar Partida
          </Button>
        </div>
      </div>

      {/* End Match Dialog */}
      <ConfirmDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        title="Encerrar partida?"
        description="Todas as estatísticas serão salvas e a partida será finalizada."
        confirmText="Encerrar"
        onConfirm={handleEndMatch}
        variant="destructive"
      />
    </div>
  );
};

export default MatchLive;
