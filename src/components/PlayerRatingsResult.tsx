import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Star, User } from 'lucide-react';

interface PlayerRating {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  averageRating: number;
  totalVotes: number;
}

interface PlayerRatingsResultProps {
  matchId: string;
}

const PlayerRatingsResult = ({ matchId }: PlayerRatingsResultProps) => {
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      // Get all ratings for this match
      const { data: ratingsData, error } = await supabase
        .from('player_ratings')
        .select('rated_id, rating')
        .eq('match_id', matchId);

      if (error || !ratingsData) {
        setLoading(false);
        return;
      }

      // Group ratings by player
      const ratingsByPlayer: Record<string, number[]> = {};
      for (const rating of ratingsData) {
        if (!ratingsByPlayer[rating.rated_id]) {
          ratingsByPlayer[rating.rated_id] = [];
        }
        ratingsByPlayer[rating.rated_id].push(rating.rating);
      }

      // Get player profiles
      const playerIds = Object.keys(ratingsByPlayer);
      if (playerIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', playerIds);

      // Calculate averages and create final data
      const playerRatings: PlayerRating[] = Object.entries(ratingsByPlayer).map(
        ([playerId, playerRatings]) => {
          const profile = profiles?.find(p => p.id === playerId);
          const average = playerRatings.reduce((a, b) => a + b, 0) / playerRatings.length;

          return {
            playerId,
            playerName: profile?.name || 'Jogador',
            playerAvatar: profile?.avatar_url || null,
            averageRating: Math.round(average * 10) / 10,
            totalVotes: playerRatings.length,
          };
        }
      );

      // Sort by average rating
      playerRatings.sort((a, b) => b.averageRating - a.averageRating);

      setRatings(playerRatings);
      setLoading(false);
    };

    fetchRatings();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Nenhuma avaliação registrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-display tracking-wider text-muted-foreground uppercase">
        Avaliações dos Jogadores
      </h4>

      <div className="space-y-2">
        {ratings.map((player, index) => (
          <div
            key={player.playerId}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-card/50'
            }`}
          >
            <span className="text-sm font-bold text-muted-foreground w-5">
              {index + 1}º
            </span>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={player.playerAvatar || undefined} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-medium text-sm">{player.playerName}</p>
              <p className="text-xs text-muted-foreground">
                {player.totalVotes} {player.totalVotes === 1 ? 'voto' : 'votos'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-500">
                {player.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerRatingsResult;
