import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Sparkles, Shield, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type MatchParticipant = Database['public']['Tables']['match_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface GameSummaryProps {
  matchId: string;
  participants: (MatchParticipant & { profile: Profile | null })[];
  mvpId?: string | null;
  bestDefenderId?: string | null;
}

interface VoteCount {
  voted_for_id: string;
  count: number;
}

const GameSummary = ({ matchId, participants, mvpId, bestDefenderId }: GameSummaryProps) => {
  const [mvpVotes, setMvpVotes] = useState<VoteCount[]>([]);
  const [defenderVotes, setDefenderVotes] = useState<VoteCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      // Fetch MVP votes
      const { data: mvpData } = await supabase
        .from('match_mvp_votes')
        .select('voted_for_id')
        .eq('match_id', matchId);

      if (mvpData) {
        const voteCounts = mvpData.reduce((acc: Record<string, number>, vote) => {
          acc[vote.voted_for_id] = (acc[vote.voted_for_id] || 0) + 1;
          return acc;
        }, {});

        const sorted = Object.entries(voteCounts)
          .map(([voted_for_id, count]) => ({ voted_for_id, count }))
          .sort((a, b) => b.count - a.count);

        setMvpVotes(sorted);
      }

      // Fetch defender votes
      const { data: defenderData } = await supabase
        .from('match_defender_votes')
        .select('voted_for_id')
        .eq('match_id', matchId);

      if (defenderData) {
        const voteCounts = defenderData.reduce((acc: Record<string, number>, vote) => {
          acc[vote.voted_for_id] = (acc[vote.voted_for_id] || 0) + 1;
          return acc;
        }, {});

        const sorted = Object.entries(voteCounts)
          .map(([voted_for_id, count]) => ({ voted_for_id, count }))
          .sort((a, b) => b.count - a.count);

        setDefenderVotes(sorted);
      }

      setLoading(false);
    };

    fetchVotes();
  }, [matchId]);

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

  // Find MVP (from match.mvp_id or most voted)
  const mvpPlayer = mvpId
    ? participants.find((p) => p.user_id === mvpId)
    : mvpVotes.length > 0
    ? participants.find((p) => p.user_id === mvpVotes[0].voted_for_id)
    : null;

  // Find Best Defender (from match.best_defender_id or most voted)
  const bestDefender = bestDefenderId
    ? participants.find((p) => p.user_id === bestDefenderId)
    : defenderVotes.length > 0
    ? participants.find((p) => p.user_id === defenderVotes[0].voted_for_id)
    : null;

  const submittedCount = confirmedParticipants.filter(
    (p) => p.stats_submitted
  ).length;
  const allSubmitted = submittedCount === confirmedParticipants.length;

  // Helper to get player name
  const getPlayerName = (participant: MatchParticipant & { profile: Profile | null }) => {
    if (participant.guest_name) return participant.guest_name;
    return participant.profile?.name || 'Jogador';
  };

  const getPlayerAvatar = (participant: MatchParticipant & { profile: Profile | null }) => {
    if (participant.guest_name) return null;
    return participant.profile?.avatar_url;
  };

  const getPlayerPosition = (participant: MatchParticipant & { profile: Profile | null }) => {
    if (participant.guest_position) return participant.guest_position;
    return participant.profile?.position || 'N/A';
  };

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

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* MVP */}
          <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">MVP</p>
            {mvpPlayer ? (
              <>
                <p className="font-bold text-sm truncate">{getPlayerName(mvpPlayer)}</p>
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

          {/* Best Defender */}
          <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Melhor Defensor</p>
            {bestDefender ? (
              <>
                <p className="font-bold text-sm truncate">{getPlayerName(bestDefender)}</p>
                {defenderVotes.length > 0 && (
                  <p className="text-xs text-blue-500">
                    {defenderVotes[0]?.count || 0} votos
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Aguardando votos</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Top Scorer */}
          <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/30">
            <Target className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Artilheiro</p>
            {topScorer && (topScorer.goals || 0) > 0 ? (
              <>
                <p className="font-bold text-sm truncate">{getPlayerName(topScorer)}</p>
                <p className="text-xs text-primary">{topScorer.goals} gols</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">-</p>
            )}
          </div>

          {/* Top Assister */}
          <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Garçom</p>
            {topAssister && (topAssister.assists || 0) > 0 ? (
              <>
                <p className="font-bold text-sm truncate">{getPlayerName(topAssister)}</p>
                <p className="text-xs text-emerald-500">{topAssister.assists} assist.</p>
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
                    {getPlayerAvatar(participant) ? (
                      <img
                        src={getPlayerAvatar(participant)!}
                        alt={getPlayerName(participant)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {getPlayerName(participant).charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{getPlayerName(participant)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPlayerPosition(participant)}
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
                        <p className="font-bold text-emerald-500">{participant.assists || 0}</p>
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