import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Shield, Target, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type RatingHistory = Database['public']['Tables']['rating_history']['Row'];
type Game = Database['public']['Tables']['games']['Row'];

interface MatchHistoryEntry extends RatingHistory {
  game: Game | null;
}

interface MatchHistoryProps {
  userId: string;
}

const MatchHistory = ({ userId }: MatchHistoryProps) => {
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('rating_history')
        .select(`
          *,
          game:games(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setHistory(data as MatchHistoryEntry[]);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum histórico de partidas ainda</p>
        <p className="text-sm mt-1">Participe de jogos para ver sua evolução</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const overallChange = entry.overall_after - entry.overall_before;

        return (
          <div
            key={entry.id}
            className="fifa-card p-4"
          >
            {/* Game Info */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">{entry.game?.name || 'Pelada'}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.game?.location} •{' '}
                  {new Date(entry.created_at || '').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {overallChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : overallChange < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : null}
                <span
                  className={`font-bold ${
                    overallChange > 0
                      ? 'text-green-500'
                      : overallChange < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {overallChange > 0 ? '+' : ''}
                  {overallChange}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-bold">{entry.goals}</span>
                <span className="text-muted-foreground">gols</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-bold">{entry.assists}</span>
                <span className="text-muted-foreground">assists</span>
              </div>
              {entry.was_mvp && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500 font-bold">MVP</span>
                </div>
              )}
              {entry.was_best_defender && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-500 font-bold">Defensor</span>
                </div>
              )}
            </div>

            {/* Rating Changes */}
            <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-border">
              <RatingChange
                label="OVR"
                before={entry.overall_before}
                after={entry.overall_after}
              />
              <RatingChange
                label="ATA"
                before={entry.attack_before}
                after={entry.attack_after}
              />
              <RatingChange
                label="DEF"
                before={entry.defense_before}
                after={entry.defense_after}
              />
              <RatingChange
                label="HAB"
                before={entry.skill_before}
                after={entry.skill_after}
              />
              <RatingChange
                label="FOR"
                before={entry.strength_before}
                after={entry.strength_after}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RatingChange = ({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) => {
  const change = after - before;

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold">{after}</p>
      {change !== 0 && (
        <p
          className={`text-xs ${
            change > 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {change > 0 ? '+' : ''}
          {change}
        </p>
      )}
    </div>
  );
};

export default MatchHistory;
