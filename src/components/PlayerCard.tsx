import { User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface PlayerCardProps {
  profile: Profile;
}

const PlayerCard = ({ profile }: PlayerCardProps) => {
  const getPositionAbbr = (position: string) => {
    const abbrs: Record<string, string> = {
      'Goleiro': 'GOL',
      'Fixo': 'FIX',
      'Ala': 'ALA',
      'Pivô': 'PIV',
      'Zagueiro': 'ZAG',
      'Meia': 'MEI',
      'Atacante': 'ATA',
    };
    return abbrs[position] || position.substring(0, 3).toUpperCase();
  };

  return (
    <div className="fifa-card animate-border-pulse p-1">
      <div className="relative bg-gradient-to-b from-card to-background rounded-xl overflow-hidden">
        {/* Top Section - Rating & Position */}
        <div className="flex justify-between items-start p-4 pb-0">
          <div className="text-center">
            <div className="text-5xl font-display text-primary leading-none">
              {profile.overall_rating}
            </div>
            <div className="text-lg font-display text-primary mt-1">
              {getPositionAbbr(profile.position)}
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
        </div>

        {/* Player Avatar Area */}
        <div className="flex justify-center py-4">
          <div className="w-32 h-32 rounded-full bg-surface-elevated border-4 border-primary flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Player Name & Info */}
        <div className="text-center px-4 pb-3">
          <h2 className="text-2xl font-display tracking-wider truncate">
            {profile.name.toUpperCase()}
          </h2>
          <div className="flex justify-center items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{profile.age} anos</span>
            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
            <span>#{profile.shirt_number}</span>
            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
            <span>{profile.dominant_foot}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 pt-2">
          <div className="bg-surface rounded-lg p-3 text-center border border-primary/30">
            <div className="text-2xl font-display text-primary">{profile.total_goals}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Gols</div>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center border border-primary/30">
            <div className="text-2xl font-display text-primary">{profile.total_assists}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Assistências</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
