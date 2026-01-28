import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Crosshair, Shield, UserX } from 'lucide-react';
import StatCounter from '@/components/StatCounter';
import { cn } from '@/lib/utils';

interface PlayerStatsFormProps {
  participantId: string;
  playerName?: string;
  playerInitials?: string;
  currentGoals: number;
  currentAssists: number;
  currentSaves?: number;
  isGoalkeeper?: boolean;
  onSubmit: () => void;
  onMarkAbsent?: () => void;
}

const PlayerStatsForm = ({
  participantId,
  playerName = 'Jogador',
  playerInitials,
  currentGoals,
  currentAssists,
  currentSaves = 0,
  isGoalkeeper = false,
  onSubmit,
  onMarkAbsent,
}: PlayerStatsFormProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState(currentGoals || 0);
  const [assists, setAssists] = useState(currentAssists || 0);
  const [saves, setSaves] = useState(currentSaves || 0);
  const [submitting, setSubmitting] = useState(false);

  // Generate initials from name if not provided
  const initials = playerInitials || playerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const handleSubmit = async () => {
    setSubmitting(true);

    const updateData: Record<string, unknown> = {
      goals,
      assists,
      stats_submitted: true,
    };

    if (isGoalkeeper) {
      updateData.saves = saves;
    }

    const { error } = await supabase
      .from('match_participants')
      .update(updateData)
      .eq('id', participantId);

    setSubmitting(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas estatísticas',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Estatísticas registradas!',
        description: 'Seus gols e assistências foram salvos',
      });
      onSubmit();
    }
  };

  return (
    <div className="fifa-card p-6 space-y-6">
      {/* Player Card Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/50">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-display text-lg tracking-wider text-foreground">
            {playerName}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Registre suas estatísticas desta partida
          </p>
        </div>
      </div>

      {/* Stats Counters */}
      <div className={cn(
        'grid gap-6 py-4',
        isGoalkeeper ? 'grid-cols-3' : 'grid-cols-2'
      )}>
        <StatCounter
          value={goals}
          onChange={setGoals}
          label="Gols"
          icon={<Target className="h-5 w-5" />}
          iconColor="text-green-500"
          size="lg"
        />
        
        <StatCounter
          value={assists}
          onChange={setAssists}
          label="Assistências"
          icon={<Crosshair className="h-5 w-5" />}
          iconColor="text-blue-500"
          size="lg"
        />

        {isGoalkeeper && (
          <StatCounter
            value={saves}
            onChange={setSaves}
            label="Defesas"
            icon={<Shield className="h-5 w-5" />}
            iconColor="text-orange-500"
            size="lg"
          />
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="sport"
          className="w-full h-12"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Confirmar Estatísticas'
          )}
        </Button>

        {onMarkAbsent && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={onMarkAbsent}
          >
            <UserX className="h-4 w-4 mr-2" />
            Não veio
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsForm;
