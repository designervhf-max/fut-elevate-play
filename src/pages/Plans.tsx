import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Check,
  Crown,
  Zap,
  Target,
  Trophy,
  BarChart3,
  History,
  Star,
  Shield,
} from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

const Plans = () => {
  const navigate = useNavigate();
  const { isPro, isAdmin, trialActive, trialDaysLeft } = useSubscription();
  const [billing, setBilling] = useState<BillingCycle>('yearly');

  const monthlyPrice = 9.9;
  const yearlyPrice = 79.9;
  const yearlyMonthly = (Math.floor((yearlyPrice / 12) * 100) / 100).toFixed(2).replace('.', ',');

  const freeFeatures = [
    { icon: Target, label: 'Criar e gerenciar peladas' },
    { icon: Shield, label: 'Confirmar presença em partidas' },
    { icon: Zap, label: 'Sorteio de times automático' },
    { icon: Star, label: 'Cronômetro de partida' },
  ];

  const proFeatures = [
    { icon: Target, label: 'Registro de gols e assistências' },
    { icon: Trophy, label: 'Ranking da pelada' },
    { icon: Crown, label: 'Votação de MVP e melhor defensor' },
    { icon: BarChart3, label: 'Estatísticas detalhadas do jogador' },
    { icon: History, label: 'Histórico completo de partidas' },
  ];

  const currentPlan = isAdmin ? 'admin' : isPro ? 'pro' : 'free';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Planos</h1>
        </div>
      </header>

      <main className="p-4 pb-6 space-y-3 max-w-lg mx-auto">
        {/* Hero — compact */}
        <section className="text-center space-y-1 animate-slide-up">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Eleve seu jogo</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Desbloqueie todas as funcionalidades do EleveFut
          </p>
        </section>

        {/* Trial Banner */}
        {trialActive && currentPlan === 'pro' && (
          <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center animate-slide-up">
            <p className="text-xs text-primary font-medium">
              ⚽ Trial Pro expira em {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        )}

        {/* Billing Toggle */}
        <section className="flex justify-center animate-slide-up">
          <div className="flex items-center bg-surface-elevated rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                billing === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                -33%
              </Badge>
            </button>
          </div>
        </section>

        {/* Free Plan */}
        <section className="fifa-card p-4 space-y-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Free</h3>
              <p className="text-xs text-muted-foreground">Funcionalidades básicas</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">R$0</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>

          <div className="space-y-2">
            {freeFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {currentPlan === 'free' && (
            <Button variant="dark" className="w-full" disabled>
              Plano atual
            </Button>
          )}
        </section>

        {/* Pro Plan */}
        <section
          className="fifa-card p-4 space-y-3 border-2 border-primary/40 relative animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2.5 text-xs">
            Mais popular
          </Badge>

          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Pro
              </h3>
              <p className="text-xs text-muted-foreground">Experiência completa</p>
            </div>
            <div className="text-right">
            {billing === 'yearly' ? (
                <>
                  <p className="text-2xl font-bold text-primary">
                    R${yearlyPrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/ano</p>
                  <p className="text-xs text-primary font-medium">
                    R${yearlyMonthly}/mês
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    R${monthlyPrice.toFixed(2).replace('.', ',')}/mês
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-primary">
                    R${monthlyPrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </>
              )}
            </div>
          </div>

          {/* All Free features */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tudo do Free, mais:</p>
            {proFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <div className="h-4.5 w-4.5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {billing === 'yearly' && (
            <div className="bg-primary/10 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs text-primary font-medium">
                💰 Economia de R${((monthlyPrice * 12) - yearlyPrice).toFixed(2).replace('.', ',')} por ano
              </p>
            </div>
          )}

          <div>
            {currentPlan === 'pro' && !trialActive ? (
              <Button variant="sport" className="w-full" disabled>
                Plano atual
              </Button>
            ) : isAdmin ? (
              <Button variant="sport" className="w-full" disabled>
                Acesso Admin
              </Button>
            ) : (
              <Button variant="sport" className="w-full" onClick={() => {}}>
                {trialActive ? 'Assinar agora' : 'Quero ser Pro'}
              </Button>
            )}
          </div>
        </section>

        {/* FAQ-like info */}
        <p className="text-xs text-muted-foreground text-center animate-slide-up" style={{ animationDelay: '0.15s' }}>
          Cancele a qualquer momento. Sem multas ou taxas extras.
        </p>
      </main>
    </div>
  );
};

export default Plans;
