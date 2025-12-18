import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trophy,
  Shield,
  Target,
  Crosshair,
  Users,
  Loader2,
} from 'lucide-react';

type MatchParticipant = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_position: string | null;
  status: string;
  goals: number;
  assists: number;
  team: number | null;
  profile?: {
    name: string;
    position: string;
    avatar_url: string | null;
  };
};

type Match = {
  id: string;
  match_date: string;
  match_time: string;
  mvp_id: string | null;
  best_defender_id: string | null;
  results_determined: boolean;
};

interface MatchStatsModalProps {
  matchId: string | null;
  onClose: () => void;
}

const MatchStatsModal = ({ matchId, onClose }: MatchStatsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [mvpProfile, setMvpProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [defenderProfile, setDefenderProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);

      // Fetch match details
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchData) {
        setMatch(matchData as Match);

        // Fetch MVP profile
        if (matchData.mvp_id) {
          const { data: mvp } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', matchData.mvp_id)
            .single();
          if (mvp) setMvpProfile(mvp);
        }

        // Fetch Defender profile
        if (matchData.best_defender_id) {
          const { data: defender } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', matchData.best_defender_id)
            .single();
          if (defender) setDefenderProfile(defender);
        }
      }

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profile:profiles(name, position, avatar_url)
        `)
        .eq('match_id', matchId)
        .eq('status', 'Confirmado');

      if (participantsData) {
        setParticipants(participantsData as MatchParticipant[]);
      }

      setLoading(false);
    };

    fetchStats();
  }, [matchId]);

  const confirmedParticipants = participants.filter(p => p.status === 'Confirmado');
  const totalGoals = confirmedParticipants.reduce((sum, p) => sum + (p.goals || 0), 0);
  const totalAssists = confirmedParticipants.reduce((sum, p) => sum + (p.assists || 0), 0);

  // Group by team
  const teamA = confirmedParticipants.filter(p => p.team === 1);
  const teamB = confirmedParticipants.filter(p => p.team === 2);
  const noTeam = confirmedParticipants.filter(p => !p.team);

  return (
    <Dialog open={!!matchId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">
            ESTATÍSTICAS DA PARTIDA
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Match Date */}
            {match && (
              <div className="text-center text-sm text-muted-foreground">
                {new Date(match.match_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="fifa-card p-3 text-center">
                <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{confirmedParticipants.length}</p>
                <p className="text-xs text-muted-foreground">Jogadores</p>
              </div>
              <div className="fifa-card p-3 text-center">
                <Target className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xl font-bold">{totalGoals}</p>
                <p className="text-xs text-muted-foreground">Gols</p>
              </div>
              <div className="fifa-card p-3 text-center">
                <Crosshair className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xl font-bold">{totalAssists}</p>
                <p className="text-xs text-muted-foreground">Assistências</p>
              </div>
            </div>

            {/* MVP & Best Defender */}
            {(mvpProfile || defenderProfile) && (
              <div className="grid grid-cols-2 gap-3">
                {mvpProfile && (
                  <div className="fifa-card p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                    <p className="text-xs text-muted-foreground mb-1">MVP</p>
                    <div className="flex items-center justify-center gap-2">
                      {mvpProfile.avatar_url ? (
                        <img
                          src={mvpProfile.avatar_url}
                          alt={mvpProfile.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-500">
                            {mvpProfile.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-sm">{mvpProfile.name}</span>
                    </div>
                  </div>
                )}
                {defenderProfile && (
                  <div className="fifa-card p-4 text-center">
                    <Shield className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                    <p className="text-xs text-muted-foreground mb-1">Melhor Defensor</p>
                    <div className="flex items-center justify-center gap-2">
                      {defenderProfile.avatar_url ? (
                        <img
                          src={defenderProfile.avatar_url}
                          alt={defenderProfile.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-500">
                            {defenderProfile.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-sm">{defenderProfile.name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams */}
            {(teamA.length > 0 || teamB.length > 0) && (
              <div className="space-y-4">
                {teamA.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">Time A</h4>
                    <div className="space-y-2">
                      {teamA.map((p) => {
                        const name = p.user_id ? p.profile?.name : p.guest_name;
                        return (
                          <div key={p.id} className="flex items-center justify-between bg-surface/50 rounded-lg p-2">
                            <span className="text-sm">{name}</span>
                            <div className="flex items-center gap-3 text-xs">
                              {p.goals > 0 && (
                                <span className="text-green-500">{p.goals} gol{p.goals > 1 ? 's' : ''}</span>
                              )}
                              {p.assists > 0 && (
                                <span className="text-blue-500">{p.assists} assist{p.assists > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {teamB.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-destructive mb-2">Time B</h4>
                    <div className="space-y-2">
                      {teamB.map((p) => {
                        const name = p.user_id ? p.profile?.name : p.guest_name;
                        return (
                          <div key={p.id} className="flex items-center justify-between bg-surface/50 rounded-lg p-2">
                            <span className="text-sm">{name}</span>
                            <div className="flex items-center gap-3 text-xs">
                              {p.goals > 0 && (
                                <span className="text-green-500">{p.goals} gol{p.goals > 1 ? 's' : ''}</span>
                              )}
                              {p.assists > 0 && (
                                <span className="text-blue-500">{p.assists} assist{p.assists > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Players without team */}
            {noTeam.length > 0 && teamA.length === 0 && teamB.length === 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Jogadores</h4>
                <div className="space-y-2">
                  {noTeam.map((p) => {
                    const name = p.user_id ? p.profile?.name : p.guest_name;
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-surface/50 rounded-lg p-2">
                        <span className="text-sm">{name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          {p.goals > 0 && (
                            <span className="text-green-500">{p.goals} gol{p.goals > 1 ? 's' : ''}</span>
                          )}
                          {p.assists > 0 && (
                            <span className="text-blue-500">{p.assists} assist{p.assists > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MatchStatsModal;
