import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Trophy, Target, Sparkles, Shield } from 'lucide-react';

interface PeladaStats {
  peladaId: string;
  peladaName: string;
  peladaLocation: string;
  gamesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  mvpCount: number;
  defenderCount: number;
}

interface PeladaCareerHistoryProps {
  userId: string;
}

const PeladaCareerHistory = ({ userId }: PeladaCareerHistoryProps) => {
  const [stats, setStats] = useState<PeladaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeladaStats = async () => {
      // Get all rating history with game info (for games table - old system)
      const { data: gameHistory } = await supabase
        .from('rating_history')
        .select(`
          goals,
          assists,
          was_mvp,
          was_best_defender,
          game:games(id, name, location)
        `)
        .eq('user_id', userId);

      // Get all match participations (for matches table - new system)
      const { data: matchParticipations } = await supabase
        .from('match_participants')
        .select(`
          goals,
          assists,
          match:matches(
            id,
            pelada_id,
            mvp_id,
            best_defender_id,
            status,
            pelada:peladas(id, name, location)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'Confirmado');

      // Aggregate stats by pelada from matches
      const peladaStatsMap: Record<string, PeladaStats> = {};

      // Process match participations (new pelada system)
      for (const participation of matchParticipations || []) {
        const match = participation.match;
        if (!match || !match.pelada) continue;
        
        const peladaId = match.pelada.id;
        
        if (!peladaStatsMap[peladaId]) {
          peladaStatsMap[peladaId] = {
            peladaId,
            peladaName: match.pelada.name,
            peladaLocation: match.pelada.location,
            gamesPlayed: 0,
            totalGoals: 0,
            totalAssists: 0,
            mvpCount: 0,
            defenderCount: 0,
          };
        }

        peladaStatsMap[peladaId].gamesPlayed += 1;
        peladaStatsMap[peladaId].totalGoals += participation.goals || 0;
        peladaStatsMap[peladaId].totalAssists += participation.assists || 0;
        
        if (match.mvp_id === userId) {
          peladaStatsMap[peladaId].mvpCount += 1;
        }
        if (match.best_defender_id === userId) {
          peladaStatsMap[peladaId].defenderCount += 1;
        }
      }

      // Process old game history (legacy system) - group by game name as pseudo-pelada
      const gameStatsMap: Record<string, PeladaStats> = {};
      for (const entry of gameHistory || []) {
        const game = entry.game;
        if (!game) continue;

        const gameKey = game.name;
        
        if (!gameStatsMap[gameKey]) {
          gameStatsMap[gameKey] = {
            peladaId: game.id,
            peladaName: game.name,
            peladaLocation: game.location,
            gamesPlayed: 0,
            totalGoals: 0,
            totalAssists: 0,
            mvpCount: 0,
            defenderCount: 0,
          };
        }

        gameStatsMap[gameKey].gamesPlayed += 1;
        gameStatsMap[gameKey].totalGoals += entry.goals || 0;
        gameStatsMap[gameKey].totalAssists += entry.assists || 0;
        
        if (entry.was_mvp) {
          gameStatsMap[gameKey].mvpCount += 1;
        }
        if (entry.was_best_defender) {
          gameStatsMap[gameKey].defenderCount += 1;
        }
      }

      // Combine both sources
      const allStats = [
        ...Object.values(peladaStatsMap),
        ...Object.values(gameStatsMap),
      ];

      // Sort by games played
      allStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

      setStats(allStats);
      setLoading(false);
    };

    fetchPeladaStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum histórico de peladas ainda</p>
        <p className="text-sm mt-1">Participe de peladas para ver sua carreira</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stats.map((pelada) => (
        <div key={pelada.peladaId} className="fifa-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold">{pelada.peladaName}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {pelada.peladaLocation}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-display font-bold text-primary">
                {pelada.gamesPlayed}
              </div>
              <p className="text-xs text-muted-foreground">jogos</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-background/50 rounded-lg p-2">
              <Target className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <div className="font-bold">{pelada.totalGoals}</div>
              <p className="text-xs text-muted-foreground">Gols</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <Sparkles className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <div className="font-bold">{pelada.totalAssists}</div>
              <p className="text-xs text-muted-foreground">Assists</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <Trophy className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
              <div className="font-bold">{pelada.mvpCount}</div>
              <p className="text-xs text-muted-foreground">MVPs</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <Shield className="h-4 w-4 mx-auto text-cyan-500 mb-1" />
              <div className="font-bold">{pelada.defenderCount}</div>
              <p className="text-xs text-muted-foreground">Defensor</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PeladaCareerHistory;
