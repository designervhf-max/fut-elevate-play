import { Target, Sparkles, Trophy, Shield, Users, Gamepad2, Award } from 'lucide-react';

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
  totalParticipations,
  totalMvps,
  totalBestDefender,
  totalSaves = 0,
  isGoalkeeper = false,
}: CareerStatsProps) => {
  const stats = [
    {
      icon: Gamepad2,
      label: 'Jogos',
      value: totalGames,
      color: 'text-primary',
    },
    {
      icon: Users,
      label: 'Participações',
      value: totalParticipations,
      color: 'text-muted-foreground',
    },
    {
      icon: Target,
      label: 'Gols',
      value: totalGoals,
      color: 'text-green-500',
    },
    {
      icon: Sparkles,
      label: 'Assistências',
      value: totalAssists,
      color: 'text-blue-500',
    },
    {
      icon: Trophy,
      label: 'MVPs',
      value: totalMvps,
      color: 'text-yellow-500',
    },
    {
      icon: Shield,
      label: 'Melhor Defensor',
      value: totalBestDefender,
      color: 'text-cyan-500',
    },
  ];

  // Add saves stat for goalkeepers
  if (isGoalkeeper) {
    stats.push({
      icon: Award,
      label: 'Defesas',
      value: totalSaves,
      color: 'text-orange-500',
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display tracking-wider text-muted-foreground uppercase">
        Estatísticas da Carreira
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="fifa-card p-3 text-center"
          >
            <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
            <div className="text-2xl font-display font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerStats;
