import { useState } from 'react';
import { CalendarDays, ChevronRight, Trophy } from 'lucide-react';
import MatchStatsModal from './MatchStatsModal';

type Match = {
  id: string;
  pelada_id: string;
  match_date: string;
  match_time: string;
  status: string;
  mvp_id: string | null;
  best_defender_id: string | null;
  results_determined: boolean;
};

interface PastMatchesListProps {
  matches: Match[];
  peladaId: string;
}

const PastMatchesList = ({ matches, peladaId }: PastMatchesListProps) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="fifa-card p-5 text-center">
        <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h4 className="font-display text-lg tracking-wider text-muted-foreground">
          NENHUM JOGO ANTERIOR
        </h4>
        <p className="text-sm text-muted-foreground mt-2">
          Quando as partidas forem finalizadas, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {matches.map((match) => {
          const matchDate = new Date(match.match_date + 'T00:00:00');
          
          return (
            <button
              key={match.id}
              onClick={() => setSelectedMatchId(match.id)}
              className="w-full fifa-card p-4 flex items-center justify-between hover:bg-surface/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {matchDate.toLocaleDateString('pt-BR', { 
                      weekday: 'short',
                      day: '2-digit', 
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {match.match_time.slice(0, 5)}
                    {match.results_determined && ' • Resultados disponíveis'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-medium">
                  Ver estatísticas
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats Modal */}
      <MatchStatsModal
        matchId={selectedMatchId}
        onClose={() => setSelectedMatchId(null)}
      />
    </>
  );
};

export default PastMatchesList;
