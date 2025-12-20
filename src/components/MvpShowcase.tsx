import { Trophy } from 'lucide-react';

interface MvpShowcaseProps {
  mvpCount: number;
  defenderCount: number;
}

const MvpShowcase = ({ mvpCount, defenderCount }: MvpShowcaseProps) => {
  if (mvpCount === 0 && defenderCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display tracking-wider text-muted-foreground uppercase">
        Conquistas
      </h3>

      <div className="flex gap-3">
        {mvpCount > 0 && (
          <div className="relative flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-amber-500/20 border border-yellow-500/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-yellow-500">
                  {mvpCount}
                </div>
                <p className="text-xs text-yellow-500/80 uppercase tracking-wider font-medium">
                  {mvpCount === 1 ? 'MVP' : 'MVPs'}
                </p>
              </div>
            </div>
          </div>
        )}

        {defenderCount > 0 && (
          <div className="relative flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-blue-500/20 border border-cyan-500/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-cyan-500">
                  {defenderCount}
                </div>
                <p className="text-xs text-cyan-500/80 uppercase tracking-wider font-medium">
                  Defensor
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MvpShowcase;
