import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Target, Shield, Zap, Dumbbell } from 'lucide-react';

type ExperienceLevel = 'iniciante' | 'amador' | 'regular' | 'experiente' | 'semi_pro';
type Frequency = 'raramente' | 'mensal' | 'semanal' | 'frequente';
type PlayStyle = 'atacante' | 'equilibrado' | 'defensor';

interface CalibrationAnswers {
  experience: ExperienceLevel | null;
  frequency: Frequency | null;
  playStyle: PlayStyle | null;
}

const experienceLevels: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'iniciante', label: 'Iniciante', description: 'Estou começando a jogar futebol' },
  { value: 'amador', label: 'Amador', description: 'Jogo casualmente com amigos' },
  { value: 'regular', label: 'Regular', description: 'Jogo regularmente e conheço bem o esporte' },
  { value: 'experiente', label: 'Experiente', description: 'Tenho anos de prática e bom nível técnico' },
  { value: 'semi_pro', label: 'Semi-Profissional', description: 'Já joguei em categorias de base ou times amadores' },
];

const frequencies: { value: Frequency; label: string; description: string }[] = [
  { value: 'raramente', label: 'Raramente', description: 'Algumas vezes por ano' },
  { value: 'mensal', label: 'Mensal', description: '1-2 vezes por mês' },
  { value: 'semanal', label: 'Semanal', description: '1 vez por semana' },
  { value: 'frequente', label: 'Frequente', description: '2 ou mais vezes por semana' },
];

const playStyles: { value: PlayStyle; label: string; description: string; icon: typeof Target }[] = [
  { value: 'atacante', label: 'Atacante', description: 'Prefiro atacar e fazer gols', icon: Target },
  { value: 'equilibrado', label: 'Equilibrado', description: 'Jogo em todas as posições', icon: Zap },
  { value: 'defensor', label: 'Defensor', description: 'Prefiro defender e marcar', icon: Shield },
];

const calculateInitialRatings = (answers: CalibrationAnswers) => {
  // Base ratings by experience
  const experienceBase: Record<ExperienceLevel, number> = {
    iniciante: 35,
    amador: 45,
    regular: 55,
    experiente: 65,
    semi_pro: 75,
  };

  // Frequency bonus
  const frequencyBonus: Record<Frequency, number> = {
    raramente: -5,
    mensal: 0,
    semanal: 3,
    frequente: 5,
  };

  const base = experienceBase[answers.experience!] + frequencyBonus[answers.frequency!];

  // Play style adjustments
  let attack = base;
  let defense = base;
  let skill = base;
  let strength = base;

  switch (answers.playStyle) {
    case 'atacante':
      attack += 8;
      skill += 5;
      defense -= 5;
      break;
    case 'defensor':
      defense += 8;
      strength += 5;
      attack -= 5;
      break;
    case 'equilibrado':
    default:
      // Small bonus for being versatile
      skill += 3;
      break;
  }

  // Calculate overall (weighted average)
  const overall = Math.round(
    attack * 0.35 + defense * 0.25 + skill * 0.25 + strength * 0.15
  );

  return {
    overall_rating: Math.min(100, Math.max(30, overall)),
    attack_rating: Math.min(100, Math.max(30, Math.round(attack))),
    defense_rating: Math.min(100, Math.max(30, Math.round(defense))),
    skill_rating: Math.min(100, Math.max(30, Math.round(skill))),
    strength_rating: Math.min(100, Math.max(30, Math.round(strength))),
  };
};

const Calibration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<CalibrationAnswers>({
    experience: null,
    frequency: null,
    playStyle: null,
  });

  const handleExperienceSelect = (value: ExperienceLevel) => {
    setAnswers((prev) => ({ ...prev, experience: value }));
    setStep(1);
  };

  const handleFrequencySelect = (value: Frequency) => {
    setAnswers((prev) => ({ ...prev, frequency: value }));
    setStep(2);
  };

  const handlePlayStyleSelect = async (value: PlayStyle) => {
    const finalAnswers = { ...answers, playStyle: value };
    setAnswers(finalAnswers);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const ratings = calculateInitialRatings(finalAnswers);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...ratings,
          calibration_completed: true,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: 'Calibração concluída!',
        description: `Seu rating inicial é ${ratings.overall_rating}`,
      });

      navigate('/home');
    } catch (error) {
      console.error('Error saving calibration:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a calibração',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Header */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-2xl font-display tracking-wider">CALIBRAÇÃO</h1>
        <p className="text-muted-foreground mt-2">
          Responda algumas perguntas para definir seu rating inicial
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 flex flex-col justify-center">
        {step === 0 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center mb-6">
              Qual seu nível de experiência?
            </h2>
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => handleExperienceSelect(level.value)}
                className="w-full p-4 fifa-card text-left hover:border-primary transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold">{level.label}</p>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center mb-6">
              Com que frequência você joga?
            </h2>
            {frequencies.map((freq) => (
              <button
                key={freq.value}
                onClick={() => handleFrequencySelect(freq.value)}
                className="w-full p-4 fifa-card text-left hover:border-primary transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold">{freq.label}</p>
                  <p className="text-sm text-muted-foreground">{freq.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center mb-6">
              Qual seu estilo de jogo?
            </h2>
            {playStyles.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() => handlePlayStyleSelect(style.value)}
                  disabled={loading}
                  className="w-full p-4 fifa-card text-left hover:border-primary transition-colors flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{style.label}</p>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                  </div>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Skip option */}
      <div className="text-center mt-8">
        <Button
          variant="ghost"
          onClick={async () => {
            setLoading(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                await supabase
                  .from('profiles')
                  .update({ calibration_completed: true })
                  .eq('id', session.user.id);
              }
              navigate('/home');
            } catch (error) {
              navigate('/home');
            }
          }}
          disabled={loading}
        >
          Pular e usar rating padrão (50)
        </Button>
      </div>
    </div>
  );
};

export default Calibration;
