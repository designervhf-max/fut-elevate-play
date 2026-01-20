import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, Target, Sparkles } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type MatchParticipant = Database['public']['Tables']['match_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PostGameStatsProps {
  matchId: string;
  participants: (MatchParticipant & { profile: Profile | null })[];
  currentUserId: string;
  onSubmit: () => void;
}

const PostGameStats = ({
  matchId,
  participants,
  currentUserId,
  onSubmit,
}: PostGameStatsProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [mvpVote, setMvpVote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const confirmedParticipants = participants.filter(
    (p) => p.status === 'Confirmado'
  );
  // Only registered players can receive votes
  const otherPlayers = confirmedParticipants.filter(
    (p) => p.user_id && p.user_id !== currentUserId && p.profile
  );

  const handleSubmit = async () => {
    if (!mvpVote) {
      toast({
        title: 'Atenção',
        description: 'Selecione o MVP da partida',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update match_participants with goals/assists
      const { error: participantError } = await supabase
        .from('match_participants')
        .update({
          goals,
          assists,
          stats_submitted: true,
        })
        .eq('match_id', matchId)
        .eq('user_id', currentUserId);

      if (participantError) throw participantError;

      // 2. Save MVP vote
      const { error: voteError } = await supabase.from('match_mvp_votes').insert({
        match_id: matchId,
        voter_id: currentUserId,
        voted_for_id: mvpVote,
      });

      if (voteError) throw voteError;

      toast({
        title: 'Estatísticas enviadas!',
        description: 'Suas estatísticas foram registradas com sucesso',
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fifa-card p-5 space-y-5">
      <div className="text-center">
        <h3 className="font-display text-xl tracking-wider text-primary">
          REGISTRAR ESTATÍSTICAS
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Informe seu desempenho na partida
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Gols
          </Label>
          <Input
            id="goals"
            type="number"
            min={0}
            max={20}
            value={goals}
            onChange={(e) => setGoals(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center text-lg font-bold"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assists" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Assistências
          </Label>
          <Input
            id="assists"
            type="number"
            min={0}
            max={20}
            value={assists}
            onChange={(e) => setAssists(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center text-lg font-bold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Votar no MVP
        </Label>
        <Select value={mvpVote} onValueChange={setMvpVote}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o melhor jogador" />
          </SelectTrigger>
          <SelectContent>
            {otherPlayers.map((player) => (
              <SelectItem key={player.user_id!} value={player.user_id!}>
                <div className="flex items-center gap-2">
                  <span>{player.profile!.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({player.profile!.position})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Vote no jogador que mais se destacou (exceto você mesmo)
        </p>
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
          'Enviar Estatísticas'
        )}
      </Button>
    </div>
  );
};

export default PostGameStats;