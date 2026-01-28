import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface OverallStatsProps {
  profile: Profile;
}

const OverallStats = ({ profile }: OverallStatsProps) => {
  const attributes = [
    { label: 'ATA', value: profile.attack_rating || 50 },
    { label: 'DEF', value: profile.defense_rating || 50 },
    { label: 'FOR', value: profile.strength_rating || 50 },
    { label: 'HAB', value: profile.skill_rating || 50 },
  ];

  return (
    <div className="flex items-center gap-4">
      {/* Overall */}
      <div className="flex items-center gap-2">
        <span className="text-4xl font-bold text-primary">{profile.overall_rating}</span>
      </div>
      
      {/* Divider */}
      <div className="h-8 w-px bg-border" />
      
      {/* Attributes */}
      <div className="flex gap-4">
        {attributes.map((attr) => (
          <div key={attr.label} className="text-center">
            <div className="text-xs text-muted-foreground">{attr.label}</div>
            <div className="text-sm font-medium text-foreground">{attr.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallStats;
