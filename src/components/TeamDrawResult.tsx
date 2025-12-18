import { Star } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];

type ParticipantWithProfile = GameParticipant & { profile: Profile | null };

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

const getPositionAbbr = (position: string | null | undefined): string => {
  if (!position) return 'N/A';
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

// Helper to get player display info (handles both registered and guest players)
const getPlayerInfo = (participant: ParticipantWithProfile) => {
  const isGuest = !participant.user_id;
  return {
    name: isGuest ? participant.guest_name || 'Jogador' : participant.profile?.name || 'Jogador',
    position: isGuest ? participant.guest_position : participant.profile?.position,
    avatarUrl: isGuest ? null : participant.profile?.avatar_url,
    rating: isGuest ? 50 : participant.profile?.overall_rating || 50,
    isGuest,
  };
};

const TeamDrawResult = ({ teamA, teamB, onReshuffle }: TeamDrawResultProps) => {
  const totalA = teamA.reduce((sum, p) => sum + getPlayerInfo(p).rating, 0);
  const totalB = teamB.reduce((sum, p) => sum + getPlayerInfo(p).rating, 0);
  const difference = Math.abs(totalA - totalB);

  const renderPlayer = (participant: ParticipantWithProfile) => {
    const playerInfo = getPlayerInfo(participant);
    const stars = getStars(playerInfo.rating);
    
    return (
      <div
        key={participant.id}
        className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
          {playerInfo.avatarUrl ? (
            <img
              src={playerInfo.avatarUrl}
              alt={playerInfo.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {playerInfo.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{playerInfo.name}</p>
            {playerInfo.isGuest && (
              <span className="text-[8px] bg-muted text-muted-foreground px-1 py-0.5 rounded flex-shrink-0">
                ALE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {getPositionAbbr(playerInfo.position)}
            </span>
            <div className="flex ml-1">
              {[...Array(stars)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-primary text-primary" />
              ))}
            </div>
          </div>
        </div>
        <span className="text-lg font-bold text-primary">
          {playerInfo.rating}
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
