import { Star } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];

type ParticipantWithProfile = GameParticipant & { profile: Profile };

interface TeamDrawResultProps {
  teamA: ParticipantWithProfile[];
  teamB: ParticipantWithProfile[];
  onReshuffle: () => void;
}

const getStars = (rating: number | null): number => {
  if (!rating) return 1;
  if (rating >= 90) return 5;
  if (rating >= 75) return 4;
  if (rating >= 60) return 3;
  if (rating >= 45) return 2;
  return 1;
};

const getPositionAbbr = (position: string): string => {
  const abbrs: Record<string, string> = {
    Goleiro: 'GOL',
    Fixo: 'FIX',
    Ala: 'ALA',
    Pivô: 'PIV',
    Zagueiro: 'ZAG',
    Meia: 'MEI',
    Atacante: 'ATA',
  };
  return abbrs[position] || position.slice(0, 3).toUpperCase();
};

const TeamDrawResult = ({ teamA, teamB, onReshuffle }: TeamDrawResultProps) => {
  const totalA = teamA.reduce((sum, p) => sum + (p.profile.overall_rating || 0), 0);
  const totalB = teamB.reduce((sum, p) => sum + (p.profile.overall_rating || 0), 0);
  const difference = Math.abs(totalA - totalB);

  const renderPlayer = (participant: ParticipantWithProfile) => {
    const stars = getStars(participant.profile.overall_rating);
    
    return (
      <div
        key={participant.id}
        className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
          {participant.profile.avatar_url ? (
            <img
              src={participant.profile.avatar_url}
              alt={participant.profile.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {participant.profile.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{participant.profile.name}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {getPositionAbbr(participant.profile.position)}
            </span>
            <div className="flex ml-1">
              {[...Array(stars)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-primary text-primary" />
              ))}
            </div>
          </div>
        </div>
        <span className="text-lg font-bold text-primary">
          {participant.profile.overall_rating}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Team A */}
        <div className="fifa-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-sm tracking-wider text-primary">TIME A</h4>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">
              {totalA}
            </span>
          </div>
          <div className="space-y-2">
            {teamA.map(renderPlayer)}
          </div>
        </div>

        {/* Team B */}
        <div className="fifa-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-sm tracking-wider text-secondary">TIME B</h4>
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full font-bold">
              {totalB}
            </span>
          </div>
          <div className="space-y-2">
            {teamB.map(renderPlayer)}
          </div>
        </div>
      </div>

      {/* Balance info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Diferença de rating: <span className={difference <= 5 ? 'text-green-500' : difference <= 15 ? 'text-yellow-500' : 'text-red-500'} >{difference}</span>
          {difference <= 5 && ' ⚖️ Times equilibrados!'}
        </p>
      </div>

      <button
        onClick={onReshuffle}
        className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        🔄 Sortear novamente
      </button>
    </div>
  );
};

export default TeamDrawResult;
