import { Target, Handshake, Gamepad2, HandMetal } from 'lucide-react';

interface CareerStatsProps {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  totalParticipations: number;
  totalMvps: number;
  totalBestDefender: number;
  totalSaves?: number;
  isGoalkeeper?: boolean;
}

const CareerStats = ({
  totalGames,
  totalGoals,
  totalAssists,
  totalSaves = 0,
  isGoalkeeper = false,
}: CareerStatsProps) => {
  const stats = [
    { icon: Target, label: 'Gols', value: totalGoals },
    { icon: Handshake, label: 'Assistências', value: totalAssists },
    { icon: Gamepad2, label: 'Jogos', value: totalGames },
  ];

  if (isGoalkeeper) {
    stats.push({ icon: HandMetal, label: 'Defesas', value: totalSaves });
  }

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="stat-item">
          <div className="stat-icon">
            <stat.icon />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CareerStats;
