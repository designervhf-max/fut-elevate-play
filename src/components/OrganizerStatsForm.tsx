import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Sparkles, Save } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PlayerStats {
  goals: number;
  assists: number;
}

interface OrganizerStatsFormProps {
  gameId: string;
  participants: (GameParticipant & { profile: Profile })[];
  onSubmit: () => void;
}

const OrganizerStatsForm = ({
  gameId,
  participants,
  onSubmit,
}: OrganizerStatsFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const confirmedParticipants = participants.filter(
    (p) => p.status === 'Confirmado'
  );

  // Initialize stats for all confirmed players
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>(
    () =>
      confirmedParticipants.reduce(
        (acc, p) => ({
          ...acc,
          [p.user_id]: { goals: p.goals || 0, assists: p.assists || 0 },
        }),
        {}
      )
  );

  const updateStat = (
    userId: string,
    field: 'goals' | 'assists',
    value: number
  ) => {
    setPlayerStats((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: Math.max(0, value),
      },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Update each player's stats
      for (const participant of confirmedParticipants) {
        const stats = playerStats[participant.user_id];
        if (!stats) continue;

        const { error } = await supabase
          .from('game_participants')
          .update({
            goals: stats.goals,
            assists: stats.assists,
            stats_submitted: true,
          })
          .eq('game_id', gameId)
          .eq('user_id', participant.user_id);

        if (error) throw error;
      }

      toast({
        title: 'Estatísticas salvas!',
        description: 'As estatísticas de todos os jogadores foram registradas',
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalGoals = Object.values(playerStats).reduce(
    (sum, s) => sum + s.goals,
    0
  );
  const totalAssists = Object.values(playerStats).reduce(
    (sum, s) => sum + s.assists,
    0
  );

  return (
    <div className="fifa-card p-5 space-y-5">
      <div className="text-center">
        <h3 className="font-display text-xl tracking-wider text-primary">
          REGISTRAR ESTATÍSTICAS
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os gols e assistências de cada jogador
        </p>
      </div>

      {/* Summary */}
      <div className="flex justify-center gap-6 py-3 border-y border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{totalGoals}</div>
          <div className="text-xs text-muted-foreground">Total Gols</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{totalAssists}</div>
          <div className="text-xs text-muted-foreground">Total Assists</div>
        </div>
      </div>

      {/* Players Stats */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {confirmedParticipants.map((participant) => (
          <div
            key={participant.user_id}
            className="flex items-center gap-3 p-3 bg-surface rounded-lg"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-surface-elevated border-2 border-border flex items-center justify-center flex-shrink-0">
              {participant.profile.avatar_url ? (
                <img
                  src={participant.profile.avatar_url}
                  alt={participant.profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {participant.profile.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{participant.profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {participant.profile.position}
              </p>
            </div>

            {/* Stats Inputs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-primary" />
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={playerStats[participant.user_id]?.goals || 0}
                  onChange={(e) =>
                    updateStat(
                      participant.user_id,
                      'goals',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-14 h-8 text-center text-sm font-bold p-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={playerStats[participant.user_id]?.assists || 0}
                  onChange={(e) =>
                    updateStat(
                      participant.user_id,
                      'assists',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-14 h-8 text-center text-sm font-bold p-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="sport"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            Salvar Estatísticas
          </>
        )}
      </Button>
    </div>
  );
};

export default OrganizerStatsForm;
