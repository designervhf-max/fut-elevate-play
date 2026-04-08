import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

type PremiumFeature =
  | 'goals_assists'
  | 'ranking'
  | 'mvp_voting'
  | 'detailed_stats'
  | 'match_history';

interface SubscriptionData {
  role: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
}

async function fetchSubscription(userId: string): Promise<SubscriptionData | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('role, trial_started_at, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function useSubscription() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscription(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const role = subscription?.role ?? 'free';
  const isAdmin = role === 'admin';
  const trialEndsAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;
  const now = new Date();
  const trialActive = trialEndsAt ? trialEndsAt > now : false;
  const isPro = role === 'pro' && trialActive;
  const isFree = !isAdmin && !isPro;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasAccess = (feature: PremiumFeature): boolean => {
    if (isAdmin) return true;
    if (isPro) return true;
    return false;
  };

  return {
    isAdmin,
    isPro,
    isFree,
    trialDaysLeft,
    trialActive,
    trialEndsAt,
    hasAccess,
    isLoading,
    role,
  };
}
