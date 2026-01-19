import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, Sparkles, Trophy, TrendingUp, Loader2, Flame, Activity } from 'lucide-react';

interface DetailedStatsProps {
  userId: string;
}

interface StatsData {
  goalsPerGame: number;
  assistsPerGame: number;
  mvpRate: number;
  last5GamesGoals: number[];
  monthlyPerformance: { month: string; goals: number; assists: number }[];
  currentForm: 'excellent' | 'good' | 'average' | 'poor';
  totalGames: number;
}

const DetailedStats = ({ userId }: DetailedStatsProps) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_games, total_goals, total_assists, total_mvps, total_participations')
        .eq('id', userId)
        .single();

      // Fetch last 20 games for analysis
      const { data: recentGames } = await supabase
        .from('rating_history')
        .select('goals, assists, was_mvp, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculate metrics
      const totalGames = profile?.total_games || 0;
      const goalsPerGame = totalGames > 0 
        ? (profile?.total_goals || 0) / totalGames 
        : 0;

      const assistsPerGame = totalGames > 0
        ? (profile?.total_assists || 0) / totalGames
        : 0;

      const mvpRate = totalGames > 0
        ? ((profile?.total_mvps || 0) / totalGames) * 100
        : 0;

      // Last 5 games
      const last5GamesGoals = (recentGames || []).slice(0, 5).map(g => g.goals || 0);
      
      // Pad with zeros if less than 5 games
      while (last5GamesGoals.length < 5) {
        last5GamesGoals.push(0);
      }

      // Monthly performance (last 3 months)
      const monthlyPerformance: { month: string; goals: number; assists: number }[] = [];
      const now = new Date();
      
      for (let i = 2; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthGames = (recentGames || []).filter(g => {
          const gameDate = new Date(g.created_at || '');
          return (
            gameDate.getMonth() === month.getMonth() &&
            gameDate.getFullYear() === month.getFullYear()
          );
        });
        monthlyPerformance.push({
          month: month.toLocaleDateString('pt-BR', { month: 'short' }),
          goals: monthGames.reduce((sum, g) => sum + (g.goals || 0), 0),
          assists: monthGames.reduce((sum, g) => sum + (g.assists || 0), 0),
        });
      }

      // Current form based on last 5 games
      const recentGoals = last5GamesGoals.reduce((a, b) => a + b, 0);
      let currentForm: StatsData['currentForm'] = 'average';
      if (recentGoals >= 5) currentForm = 'excellent';
      else if (recentGoals >= 3) currentForm = 'good';
      else if (recentGoals >= 1) currentForm = 'average';
      else currentForm = 'poor';

      setStats({
        goalsPerGame: Math.round(goalsPerGame * 100) / 100,
        assistsPerGame: Math.round(assistsPerGame * 100) / 100,
        mvpRate: Math.round(mvpRate * 10) / 10,
        last5GamesGoals,
        monthlyPerformance,
        currentForm,
        totalGames,
      });
      setLoading(false);
    };

    fetchDetailedStats();
  }, [userId]);

  const getFormColor = (form: string) => {
    switch (form) {
      case 'excellent':
        return 'text-green-500 bg-green-500/20';
      case 'good':
        return 'text-lime-500 bg-lime-500/20';
      case 'average':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'poor':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-muted-foreground bg-muted/20';
    }
  };

  const getFormLabel = (form: string) => {
    switch (form) {
      case 'excellent':
        return 'EXCELENTE';
      case 'good':
        return 'BOA';
      case 'average':
        return 'REGULAR';
      case 'poor':
        return 'BAIXA';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="fifa-card p-6 text-center">
        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Jogue algumas partidas para ver suas estatísticas detalhadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="fifa-card p-4 text-center">
          <Target className="h-6 w-6 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-display font-bold">{stats.goalsPerGame}</p>
          <p className="text-xs text-muted-foreground">Gols/Jogo</p>
        </div>
        <div className="fifa-card p-4 text-center">
          <Sparkles className="h-6 w-6 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-display font-bold">{stats.assistsPerGame}</p>
          <p className="text-xs text-muted-foreground">Assists/Jogo</p>
        </div>
        <div className="fifa-card p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-display font-bold">{stats.mvpRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa MVP</p>
        </div>
        <div className="fifa-card p-4 text-center">
          <Flame className="h-6 w-6 mx-auto text-orange-500 mb-2" />
          <span className={`text-sm px-2 py-1 rounded font-medium ${getFormColor(stats.currentForm)}`}>
            {getFormLabel(stats.currentForm)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Forma Atual</p>
        </div>
      </div>

      {/* Last 5 Games Mini Chart */}
      <div className="fifa-card p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Últimos 5 Jogos
        </h4>
        <div className="flex items-end justify-between gap-2 h-20">
          {stats.last5GamesGoals.map((goals, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t transition-all duration-300"
                style={{ 
                  height: `${Math.max((goals / 5) * 100, 8)}%`,
                  minHeight: goals > 0 ? '16px' : '4px',
                  opacity: goals > 0 ? 1 : 0.3
                }}
              />
              <span className="text-xs mt-1 font-medium">{goals}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Mais recente</span>
          <span>Mais antigo</span>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="fifa-card p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Performance Mensal
        </h4>
        <div className="space-y-3">
          {stats.monthlyPerformance.map((month, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm capitalize w-12">{month.month}</span>
              <div className="flex-1 mx-3">
                <div className="h-2 bg-surface rounded-full overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-green-500 rounded-l"
                    style={{ 
                      width: `${Math.min((month.goals / Math.max(month.goals + month.assists, 1)) * 100, 100)}%` 
                    }}
                  />
                  <div
                    className="h-full bg-blue-500 rounded-r"
                    style={{ 
                      width: `${Math.min((month.assists / Math.max(month.goals + month.assists, 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-green-500 font-medium w-8 text-right">{month.goals}G</span>
                <span className="text-blue-500 font-medium w-8 text-right">{month.assists}A</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Gols</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Assistências</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedStats;
