import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Target, Sparkles, Trophy, Shield, Loader2 } from 'lucide-react';

interface PlayerRankingData {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalGoals: number;
  totalAssists: number;
  totalMvps: number;
  totalDefender: number;
  gamesPlayed: number;
  goalsPerGame: number;
}

interface PeladaRankingProps {
  peladaId: string;
}

const PeladaRanking = ({ peladaId }: PeladaRankingProps) => {
  const [rankings, setRankings] = useState<PlayerRankingData[]>([]);
  const [category, setCategory] = useState<'goals' | 'assists' | 'mvp' | 'defender'>('goals');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      
      // Fetch all finished matches for this pelada
      const { data: matches } = await supabase
        .from('matches')
        .select('id, mvp_id, best_defender_id')
        .eq('pelada_id', peladaId)
        .in('status', ['finished','encerrada']);

      if (!matches || matches.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Fetch all participations in finished matches
      const { data: participations } = await supabase
        .from('match_participants')
        .select('user_id, goals, assists, match_id')
        .in('match_id', matchIds)
        .eq('status', 'Confirmado')
        .not('user_id', 'is', null);

      if (!participations) {
        setRankings([]);
        setLoading(false);
        return;
      }

      // Create MVP and defender maps — only count players confirmed in that match
      const confirmedByMatch: Record<string, Set<string>> = {};
      for (const p of participations) {
        if (!p.user_id) continue;
        if (!confirmedByMatch[p.match_id]) confirmedByMatch[p.match_id] = new Set();
        confirmedByMatch[p.match_id].add(p.user_id);
      }

      const mvpMap: Record<string, number> = {};
      const defenderMap: Record<string, number> = {};

      matches.forEach(m => {
        const confirmed = confirmedByMatch[m.id];
        if (m.mvp_id && confirmed?.has(m.mvp_id)) {
          mvpMap[m.mvp_id] = (mvpMap[m.mvp_id] || 0) + 1;
        }
        if (m.best_defender_id && confirmed?.has(m.best_defender_id)) {
          defenderMap[m.best_defender_id] = (defenderMap[m.best_defender_id] || 0) + 1;
        }
      });

      // Aggregate by player
      const playerStats: Record<string, PlayerRankingData> = {};

      for (const p of participations) {
        if (!p.user_id) continue;

        if (!playerStats[p.user_id]) {
          playerStats[p.user_id] = {
            userId: p.user_id,
            name: '',
            avatarUrl: null,
            totalGoals: 0,
            totalAssists: 0,
            totalMvps: mvpMap[p.user_id] || 0,
            totalDefender: defenderMap[p.user_id] || 0,
            gamesPlayed: 0,
            goalsPerGame: 0,
          };
        }

        playerStats[p.user_id].totalGoals += p.goals || 0;
        playerStats[p.user_id].totalAssists += p.assists || 0;
        playerStats[p.user_id].gamesPlayed += 1;
      }

      // Fetch profiles
      const userIds = Object.keys(playerStats);
      if (userIds.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      for (const profile of profiles || []) {
        if (playerStats[profile.id]) {
          playerStats[profile.id].name = profile.name;
          playerStats[profile.id].avatarUrl = profile.avatar_url;
          playerStats[profile.id].goalsPerGame =
            playerStats[profile.id].gamesPlayed > 0
              ? playerStats[profile.id].totalGoals / playerStats[profile.id].gamesPlayed
              : 0;
        }
      }

      setRankings(Object.values(playerStats).filter(p => p.name));
      setLoading(false);
    };

    fetchRankings();
  }, [peladaId]);

  // Sort by selected category
  const sortedRankings = [...rankings].sort((a, b) => {
    switch (category) {
      case 'goals':
        return b.totalGoals - a.totalGoals;
      case 'assists':
        return b.totalAssists - a.totalAssists;
      case 'mvp':
        return b.totalMvps - a.totalMvps;
      case 'defender':
        return b.totalDefender - a.totalDefender;
    }
  });

  const getValue = (player: PlayerRankingData) => {
    switch (category) {
      case 'goals':
        return player.totalGoals;
      case 'assists':
        return player.totalAssists;
      case 'mvp':
        return player.totalMvps;
      case 'defender':
        return player.totalDefender;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="fifa-card p-6 text-center">
        <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Nenhum jogo finalizado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <Button
          variant={category === 'goals' ? 'sport' : 'outline'}
          size="sm"
          onClick={() => setCategory('goals')}
          className="shrink-0 text-xs"
        >
          <Target className="h-3 w-3 mr-1" /> Gols
        </Button>
        <Button
          variant={category === 'assists' ? 'sport' : 'outline'}
          size="sm"
          onClick={() => setCategory('assists')}
          className="shrink-0 text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" /> Assists
        </Button>
        <Button
          variant={category === 'mvp' ? 'sport' : 'outline'}
          size="sm"
          onClick={() => setCategory('mvp')}
          className="shrink-0 text-xs"
        >
          <Trophy className="h-3 w-3 mr-1" /> MVPs
        </Button>
        <Button
          variant={category === 'defender' ? 'sport' : 'outline'}
          size="sm"
          onClick={() => setCategory('defender')}
          className="shrink-0 text-xs"
        >
          <Shield className="h-3 w-3 mr-1" /> Defensor
        </Button>
      </div>

      {/* Ranking List */}
      <div className="space-y-2">
        {sortedRankings.slice(0, 10).map((player, index) => (
          <div
            key={player.userId}
            className={`fifa-card p-2.5 flex items-center gap-2 ${
              index < 3 ? 'border-l-4' : ''
            } ${
              index === 0
                ? 'border-l-yellow-500'
                : index === 1
                ? 'border-l-gray-400'
                : index === 2
                ? 'border-l-amber-600'
                : ''
            }`}
          >
            <span
              className={`text-lg font-bold w-6 text-center ${
                index === 0
                  ? 'text-yellow-500'
                  : index === 1
                  ? 'text-gray-400'
                  : index === 2
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
              }`}
            >
              {index + 1}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={player.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {player.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.gamesPlayed} jogos</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-display font-bold text-primary">{getValue(player)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeladaRanking;
