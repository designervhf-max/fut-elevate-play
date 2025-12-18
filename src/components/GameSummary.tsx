import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Sparkles, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface GameSummaryProps {
  gameId: string;
  participants: (GameParticipant & { profile: Profile })[];
  mvpId?: string | null;
}

interface VoteCount {
  voted_for_id: string;
  count: number;
}

const GameSummary = ({ gameId, participants, mvpId }: GameSummaryProps) => {
  const [mvpVotes, setMvpVotes] = useState<VoteCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('mvp_votes')
        .select('voted_for_id')
        .eq('game_id', gameId);

      if (data) {
        // Count votes per player
        const voteCounts = data.reduce((acc: Record<string, number>, vote) => {
          acc[vote.voted_for_id] = (acc[vote.voted_for_id] || 0) + 1;
          return acc;
        }, {});

        const sorted = Object.entries(voteCounts)
          .map(([voted_for_id, count]) => ({ voted_for_id, count }))
          .sort((a, b) => b.count - a.count);

        setMvpVotes(sorted);
      }
      setLoading(false);
    };

    fetchVotes();
  }, [gameId]);

  if (loading) {
    return (
      <div className="fifa-card p-5 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const confirmedParticipants = participants.filter(
    (p) => p.status === 'Confirmado'
  );

  // Find top scorer
  const topScorer = [...confirmedParticipants].sort(
    (a, b) => (b.goals || 0) - (a.goals || 0)
  )[0];

  // Find top assister
  const topAssister = [...confirmedParticipants].sort(
    (a, b) => (b.assists || 0) - (a.assists || 0)
  )[0];

  // Find MVP (most voted or from game.mvp_id)
  const mvpPlayer = mvpId
    ? participants.find((p) => p.user_id === mvpId)
    : mvpVotes.length > 0
    ? participants.find((p) => p.user_id === mvpVotes[0].voted_for_id)
    : null;

  const submittedCount = confirmedParticipants.filter(
    (p) => p.stats_submitted
  ).length;
  const allSubmitted = submittedCount === confirmedParticipants.length;

  return (
    <div className="space-y-4">
      {/* Highlights */}
      <div className="fifa-card p-5">
        <h3 className="font-display text-xl tracking-wider text-primary mb-4 text-center">
          DESTAQUES DA PARTIDA
        </h3>

        {!allSubmitted && (
          <p className="text-xs text-muted-foreground text-center mb-4">
            {submittedCount}/{confirmedParticipants.length} jogadores enviaram estatísticas
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {/* MVP */}
          <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">MVP</p>
            {mvpPlayer ? (
              <>
                <p className="font-bold text-sm truncate">{mvpPlayer.profile.name}</p>
                {mvpVotes.length > 0 && (
                  <p className="text-xs text-yellow-500">
                    {mvpVotes[0]?.count || 0} votos
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Aguardando votos</p>
            )}
          </div>

          {/* Top Scorer */}
          <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/30">
            <Target className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Artilheiro</p>
            {topScorer && (topScorer.goals || 0) > 0 ? (
              <>
                <p className="font-bold text-sm truncate">{topScorer.profile.name}</p>
                <p className="text-xs text-primary">{topScorer.goals} gols</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">-</p>
            )}
          </div>

          {/* Top Assister */}
          <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Sparkles className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Garçom</p>
            {topAssister && (topAssister.assists || 0) > 0 ? (
              <>
                <p className="font-bold text-sm truncate">{topAssister.profile.name}</p>
                <p className="text-xs text-blue-500">{topAssister.assists} assist.</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">-</p>
            )}
          </div>
        </div>
      </div>

      {/* All Players Stats */}
      <div className="fifa-card p-5">
        <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Estatísticas dos Jogadores
        </h3>

        <div className="space-y-2">
          {confirmedParticipants
            .sort((a, b) => (b.goals || 0) + (b.assists || 0) - ((a.goals || 0) + (a.assists || 0)))
            .map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
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
                  <div>
                    <p className="font-semibold text-sm">{participant.profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.profile.position}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {participant.stats_submitted ? (
                    <>
                      <div className="text-center">
                        <p className="font-bold text-primary">{participant.goals || 0}</p>
                        <p className="text-xs text-muted-foreground">Gols</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-blue-500">{participant.assists || 0}</p>
                        <p className="text-xs text-muted-foreground">Assist.</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pendente</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GameSummary;
