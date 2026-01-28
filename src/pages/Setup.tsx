import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type GameType = Database['public']['Enums']['game_type'];

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'Futsal', label: 'Futsal' },
  { value: 'Society', label: 'Campo Society' },
  { value: 'Campo', label: 'Campo' },
];

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      toast({
        title: "Selecione uma opção",
        description: "Escolha seu tipo de jogo preferido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_game_type: selected })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar sua preferência",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">
          Configuração
        </h1>
        <p className="text-muted-foreground">
          Você prefere jogar:
        </p>
      </div>

      {/* Game Type Options */}
      <div className="w-full max-w-sm space-y-4 mb-10">
        {gameTypes.map((type, index) => (
          <button
            key={type.value}
            onClick={() => setSelected(type.value)}
            className={`w-full p-5 rounded-xl border-2 transition-all duration-300 animate-slide-up ${
              selected === type.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-center">
              <span className={`font-semibold text-lg ${
                selected === type.value ? 'text-primary' : 'text-foreground'
              }`}>
                {type.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <Button
          variant="sport"
          size="lg"
          className="w-full"
          onClick={handleContinue}
          disabled={loading || !selected}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Próximo →'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Setup;
