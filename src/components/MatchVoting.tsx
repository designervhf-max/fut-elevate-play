import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy, CheckCircle, Clock } from 'lucide-react';

type MatchParticipant = {
  id: string;
  match_id: string;
  user_id: string | null;
  guest_name: string | null;
  status: string;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
    overall_rating: number;
  };
};

interface MatchVotingProps {
  matchId: string;
  participants: MatchParticipant[];
  currentUserId: string;
  matchEndedAt: string;
  onVoteSubmitted: () => void;
}

const MatchVoting = ({
  matchId,
  participants,
  currentUserId,
  matchEndedAt,
  onVoteSubmitted,
}: MatchVotingProps) => {
  const { toast } = useToast();
  const [mvpVote, setMvpVote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calculate remaining time
  const endTime = new Date(matchEndedAt).getTime() + 48 * 60 * 60 * 1000;
  const remainingMs = endTime - Date.now();
  const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));

  // Eligible players: confirmed, with user_id, not the current user
  const eligiblePlayers = participants.filter(
    (p) => p.status === 'Confirmado' && p.user_id && p.user_id !== currentUserId
  );

  // Check if user already voted
  useEffect(() => {
    const checkExistingVotes = async () => {
      const { data: existingVote } = await supabase
        .from('match_mvp_votes')
        .select('id')
        .eq('match_id', matchId)
        .eq('voter_id', currentUserId)
        .maybeSingle();

      if (existingVote) {
        setHasVoted(true);
      }
      setLoading(false);
    };

    checkExistingVotes();
  }, [matchId, currentUserId]);

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
      const { error } = await supabase.from('match_mvp_votes').insert({
        match_id: matchId,
        voter_id: currentUserId,
        voted_for_id: mvpVote,
      });

      if (error) throw error;

      toast({
        title: 'Voto registrado!',
        description: 'Seu voto para MVP foi computado',
      });

      setHasVoted(true);
      onVoteSubmitted();
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu voto',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fifa-card p-5 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="fifa-card p-5 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-display text-lg tracking-wider text-primary">
          VOTO REGISTRADO
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguardando outros jogadores votarem
        </p>
      </div>
    );
  }

  if (eligiblePlayers.length === 0) {
    return (
      <div className="fifa-card p-5 text-center">
        <Trophy className="h-10 w-10 text-yellow-500/50 mx-auto mb-3" />
        <h3 className="font-display text-lg tracking-wider text-muted-foreground">
          SEM JOGADORES ELEGÍVEIS
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Não há outros jogadores para votar
        </p>
      </div>
    );
  }

  return (
    <div className="fifa-card p-5 space-y-4">
      <div className="text-center">
        <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="font-display text-lg tracking-wider text-primary">
          VOTE NO MVP
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Encerra em {remainingHours}h</span>
        </div>
      </div>

      <div className="space-y-2">
        <Select value={mvpVote} onValueChange={setMvpVote}>
          <SelectTrigger>
            <SelectValue placeholder="Quem foi o destaque?" />
          </SelectTrigger>
          <SelectContent>
            {eligiblePlayers.map((player) => (
              <SelectItem key={player.user_id!} value={player.user_id!}>
                <div className="flex items-center gap-2">
                  <span>{player.profile?.name || player.guest_name || 'Jogador'}</span>
                  {player.profile?.position && (
                    <span className="text-xs text-muted-foreground">
                      ({player.profile.position})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Você não pode votar em si mesmo
      </p>

      <Button
        variant="sport"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Confirmar Voto'
        )}
      </Button>
    </div>
  );
};

export default MatchVoting;
