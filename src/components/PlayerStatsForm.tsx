import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Crosshair } from 'lucide-react';

interface PlayerStatsFormProps {
  participantId: string;
  currentGoals: number;
  currentAssists: number;
  onSubmit: () => void;
}

const PlayerStatsForm = ({
  participantId,
  currentGoals,
  currentAssists,
  onSubmit,
}: PlayerStatsFormProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState(currentGoals || 0);
  const [assists, setAssists] = useState(currentAssists || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    const { error } = await supabase
      .from('match_participants')
      .update({
        goals,
        assists,
        stats_submitted: true,
      })
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
    <div className="fifa-card p-5 space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider text-primary">
          SUAS ESTATÍSTICAS
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Registre seus gols e assistências desta partida
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-green-500" />
            Gols
          </label>
          <Input
            type="number"
            min={0}
            value={goals}
            onChange={(e) => setGoals(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center text-lg font-bold"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Crosshair className="h-4 w-4 text-blue-500" />
            Assistências
          </label>
          <Input
            type="number"
            min={0}
            value={assists}
            onChange={(e) => setAssists(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center text-lg font-bold"
          />
        </div>
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
          'Confirmar Estatísticas'
        )}
      </Button>
    </div>
  );
};

export default PlayerStatsForm;
