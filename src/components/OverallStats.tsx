import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface OverallStatsProps {
  profile: Profile;
}

const OverallStats = ({ profile }: OverallStatsProps) => {
  const stats = [
    { label: 'ATA', value: profile.attack_rating, color: 'from-red-500 to-orange-500' },
    { label: 'DEF', value: profile.defense_rating, color: 'from-blue-500 to-cyan-500' },
    { label: 'HAB', value: profile.skill_rating, color: 'from-purple-500 to-pink-500' },
    { label: 'FOR', value: profile.strength_rating, color: 'from-green-500 to-emerald-500' },
  ];

  const getStars = (rating: number) => {
    const stars = Math.round((rating / 99) * 5);
    return stars;
  };

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="fifa-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-muted-foreground uppercase tracking-wider">Overall</h3>
            <div className="text-5xl font-display neon-text mt-1">
              {profile.overall_rating}
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 ${
                  star <= getStars(profile.overall_rating || 50)
                    ? 'text-primary glow-neon'
                    : 'text-muted'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Attribute Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="stat-circle w-16 h-16 mx-auto mb-2">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
            </div>
            <span className="text-xs font-display tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallStats;
