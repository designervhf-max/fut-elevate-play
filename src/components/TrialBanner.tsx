import { useSubscription } from '@/hooks/useSubscription';

const TrialBanner = () => {
  const { isAdmin, isPro, isFree, trialDaysLeft, trialActive, isLoading } = useSubscription();

  if (isLoading || isAdmin) return null;

  if (isPro && trialActive) {
    return (
      <div className="mx-4 mt-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-center">
        <p className="text-sm text-primary font-medium">
          ⚽ Seu trial Pro expira em {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}
        </p>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="mx-4 mt-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
        <p className="text-sm text-destructive font-medium">
          🔒 Seu trial expirou. Assine o Pro para continuar.
        </p>
      </div>
    );
  }

  return null;
};

export default TrialBanner;
