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
import { Loader2, Trophy, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type MatchParticipant = Database['public']['Tables']['match_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PlayerVotingProps {
  matchId: string;
  participants: (MatchParticipant & { profile: Profile | null })[];
  currentUserId: string;
  onVoteSubmitted: () => void;
}

const PlayerVoting = ({
  matchId,
  participants,
  currentUserId,
  onVoteSubmitted,
}: PlayerVotingProps) => {
  const { toast } = useToast();
  const [mvpVote, setMvpVote] = useState<string>('');
  const [defenderVote, setDefenderVote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  const confirmedParticipants = participants.filter(
    (p) => p.status === 'Confirmado'
  );
  
  // Only registered players (with user_id) can receive votes
  const eligiblePlayers = confirmedParticipants.filter(
    (p) => p.user_id && p.user_id !== currentUserId && p.profile
  );
  
  // Count guest players for info message
  const guestPlayersCount = confirmedParticipants.filter(p => !p.user_id).length;

  // Check if user already voted
  useEffect(() => {
    const checkExistingVotes = async () => {
      const { data: mvpVoteData } = await supabase
        .from('match_mvp_votes')
        .select('id')
        .eq('match_id', matchId)
        .eq('voter_id', currentUserId)
        .maybeSingle();

      if (mvpVoteData) {
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

    if (!defenderVote) {
      toast({
        title: 'Atenção',
        description: 'Selecione o melhor defensor',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Save MVP vote
      const { error: mvpError } = await supabase.from('match_mvp_votes').insert({
        match_id: matchId,
        voter_id: currentUserId,
        voted_for_id: mvpVote,
      });

      if (mvpError) {
        if (mvpError.code === '23505') {
          setHasVoted(true);
          onVoteSubmitted();
          return;
        }
        throw mvpError;
      }

      // Save defender vote
      const { error: defenderError } = await supabase
        .from('match_defender_votes')
        .insert({
          match_id: matchId,
          voter_id: currentUserId,
          voted_for_id: defenderVote,
        });

      if (defenderError) {
        if (defenderError.code === '23505') {
          setHasVoted(true);
          onVoteSubmitted();
          return;
        }
        throw defenderError;
      }

      toast({
        title: 'Voto registrado!',
        description: 'Seu voto foi computado com sucesso',
      });

      setHasVoted(true);
      onVoteSubmitted();
    } catch (error) {
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
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-display text-xl tracking-wider text-primary">
          VOTO REGISTRADO
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguardando outros jogadores votarem para determinar os resultados
        </p>
      </div>
    );
  }

  if (eligiblePlayers.length === 0) {
    return (
      <div className="fifa-card p-5 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="font-display text-xl tracking-wider text-primary">
          VOTAÇÃO INDISPONÍVEL
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Não há jogadores registrados elegíveis para votação
        </p>
      </div>
    );
  }

  return (
    <div className="fifa-card p-5 space-y-5">
      <div className="text-center">
        <h3 className="font-display text-xl tracking-wider text-primary">
          VOTAÇÃO
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vote nos destaques da partida
        </p>
      </div>

      {guestPlayersCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            {guestPlayersCount} jogador(es) aleatório(s) não participam da votação
          </p>
        </div>
      )}

      {/* MVP Vote */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Melhor Jogador (MVP)
        </label>
        <Select value={mvpVote} onValueChange={setMvpVote}>
          <SelectTrigger>
            <SelectValue placeholder="Quem foi o destaque?" />
          </SelectTrigger>
          <SelectContent>
            {eligiblePlayers.map((player) => (
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
      </div>

      {/* Defender Vote */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-blue-500" />
          Melhor Defensor
        </label>
        <Select value={defenderVote} onValueChange={setDefenderVote}>
          <SelectTrigger>
            <SelectValue placeholder="Quem se destacou na defesa?" />
          </SelectTrigger>
          <SelectContent>
            {eligiblePlayers.map((player) => (
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
          'Confirmar Votos'
        )}
      </Button>
    </div>
  );
};

export default PlayerVoting;