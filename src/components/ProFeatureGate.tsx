import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PremiumFeature =
  | 'goals_assists'
  | 'ranking'
  | 'mvp_voting'
  | 'detailed_stats'
  | 'match_history';

interface ProFeatureGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallbackTitle?: string;
}

const ProFeatureGate = ({
  feature,
  children,
  fallbackTitle,
}: ProFeatureGateProps) => {
  const { hasAccess, isLoading } = useSubscription();

  if (isLoading) return null;

  if (hasAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="fifa-card p-6 text-center space-y-4 border border-primary/30">
      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
        <Trophy className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          {fallbackTitle || 'Funcionalidade EleveFut Pro'}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Assine o plano Pro para desbloquear esta funcionalidade e aproveitar o
          EleveFut completo.
        </p>
      </div>
      <Button
        variant="sport"
        className="w-full"
        onClick={() => {}}
      >
        Quero ser Pro
      </Button>
    </div>
  );
};

export default ProFeatureGate;
