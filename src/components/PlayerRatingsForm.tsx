import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, User } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface PlayerRatingsFormProps {
  matchId: string;
  currentUserId: string;
  players: Player[];
  onSubmit: () => void;
}

const PlayerRatingsForm = ({
  matchId,
  currentUserId,
  players,
  onSubmit,
}: PlayerRatingsFormProps) => {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter out current user
  const eligiblePlayers = players.filter(p => p.id !== currentUserId);

  const handleRatingChange = (playerId: string, value: number[]) => {
    setRatings(prev => ({ ...prev, [playerId]: value[0] }));
  };

  const handleSubmit = async () => {
    const ratedPlayers = Object.entries(ratings).filter(([, rating]) => rating > 0);
    
    if (ratedPlayers.length === 0) {
      toast({
        title: 'Avalie pelo menos um jogador',
        description: 'Dê notas aos jogadores que você quer avaliar',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const insertData = ratedPlayers.map(([playerId, rating]) => ({
      match_id: matchId,
      rater_id: currentUserId,
      rated_id: playerId,
      rating,
    }));

    const { error } = await supabase
      .from('player_ratings')
      .upsert(insertData, { onConflict: 'match_id,rater_id,rated_id' });

    setSubmitting(false);

    if (error) {
      toast({
        title: 'Erro ao enviar avaliações',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Avaliações enviadas!',
        description: 'Suas notas foram registradas',
      });
      onSubmit();
    }
  };

  if (eligiblePlayers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Não há jogadores para avaliar</p>
      </div>
    );
  }

  return (
    <div className="fifa-card p-5 space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider text-primary">
          AVALIAR JOGADORES
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Dê uma nota de 0 a 10 para cada jogador
        </p>
      </div>

      <div className="space-y-4">
        {eligiblePlayers.map((player) => {
          const rating = ratings[player.id] || 0;
          
          return (
            <div key={player.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player.avatarUrl || undefined} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{player.name}</p>
                </div>
                <div className="flex items-center gap-1 min-w-[60px] justify-end">
                  <Star className={`h-4 w-4 ${rating > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                  <span className={`font-bold ${rating > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    {rating}
                  </span>
                </div>
              </div>
              
              <Slider
                value={[rating]}
                onValueChange={(value) => handleRatingChange(player.id, value)}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="sport"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Enviar Avaliações'
        )}
      </Button>
    </div>
  );
};

export default PlayerRatingsForm;
