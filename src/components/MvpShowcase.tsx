import { Trophy, Shield } from 'lucide-react';

interface MvpShowcaseProps {
  mvpCount: number;
  defenderCount: number;
}

const MvpShowcase = ({ mvpCount, defenderCount }: MvpShowcaseProps) => {
  if (mvpCount === 0 && defenderCount === 0) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {mvpCount > 0 && (
        <div className="stat-item">
          <div className="stat-icon">
            <Trophy />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{mvpCount}</div>
            <div className="text-xs text-muted-foreground">MVP</div>
          </div>
        </div>
      )}
      
      {defenderCount > 0 && (
        <div className="stat-item">
          <div className="stat-icon">
            <Shield />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{defenderCount}</div>
            <div className="text-xs text-muted-foreground">Craque da Defesa</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MvpShowcase;
