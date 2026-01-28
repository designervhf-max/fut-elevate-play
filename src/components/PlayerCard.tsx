import { User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface PlayerCardProps {
  profile: Profile;
  showShareButton?: boolean;
  onShare?: () => void;
}

const PlayerCard = ({ profile, showShareButton = false, onShare }: PlayerCardProps) => {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="fifa-card p-4">
        {/* Top Section - Rating & Position */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-5xl font-bold text-primary leading-none">
              {profile.overall_rating}
            </div>
            <div className="text-lg font-medium text-primary/80 mt-1">
              {getPositionAbbr(profile.position)}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>#{profile.shirt_number}</div>
          </div>
        </div>

        {/* Player Avatar */}
        <div className="flex justify-center py-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-muted-foreground">
                {getInitials(profile.name)}
              </span>
            )}
          </div>
        </div>

        {/* Player Name */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {profile.name}
          </h2>
        </div>

        {/* Attributes Row */}
        <div className="flex justify-center gap-6 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">ATA</div>
            <div className="text-lg font-medium text-foreground">{profile.attack_rating || 50}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">DEF</div>
            <div className="text-lg font-medium text-foreground">{profile.defense_rating || 50}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">FOR</div>
            <div className="text-lg font-medium text-foreground">{profile.strength_rating || 50}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">HAB</div>
            <div className="text-lg font-medium text-foreground">{profile.skill_rating || 50}</div>
          </div>
        </div>
      </div>

      {/* Share Button */}
      {showShareButton && (
        <button 
          onClick={onShare}
          className="w-full py-3 rounded-xl bg-muted text-foreground text-sm font-medium transition-colors hover:bg-muted/80"
        >
          Compartilhar card
        </button>
      )}
    </div>
  );
};

export default PlayerCard;
