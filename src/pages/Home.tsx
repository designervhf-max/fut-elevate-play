import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import AvatarUpload from '@/components/AvatarUpload';
import NextMatchCard from '@/components/NextMatchCard';
import SectionCard from '@/components/SectionCard';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { Calendar, Plus, LogOut } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';

const Home = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile, isLoading } = useProfile(userId);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/login');
  };

  const handleAvatarUpdate = (url: string) => {
    // Invalidate profile cache to refetch with new avatar
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  };

  const getPositionAbbr = (position: string) => {
    const abbrs: Record<string, string> = {
      'Goleiro': 'GOL',
      'Fixo': 'FIX',
      'Ala': 'ALA',
      'Pivô': 'PIV',
      'Zagueiro': 'ZAG',
      'Meia': 'MEI',
      'Atacante': 'ATA',
    };
    return abbrs[position] || position.substring(0, 3).toUpperCase();
  };

  if (isLoading || !userId) {
    return <HomeSkeleton />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 glass px-4 py-3 safe-top">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold lowercase">{profile.name.toLowerCase().split(' ')[0]}</h1>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 space-y-4">
          {/* Profile Summary */}
          <section className="flex items-center gap-4 animate-slide-up">
            <AvatarUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url}
              onUploadComplete={handleAvatarUpdate}
              size="md"
            />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase mb-1">{getPositionAbbr(profile.position)}</div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-display text-primary">{profile.overall_rating}</span>
                <div className="h-8 w-px bg-border" />
                <div className="flex gap-3 text-center">
                  <div><div className="text-xs text-muted-foreground">ATA</div><div className="text-sm font-semibold">{profile.attack_rating || 50}</div></div>
                  <div><div className="text-xs text-muted-foreground">DEF</div><div className="text-sm font-semibold">{profile.defense_rating || 50}</div></div>
                  <div><div className="text-xs text-muted-foreground">FOR</div><div className="text-sm font-semibold">{profile.strength_rating || 50}</div></div>
                  <div><div className="text-xs text-muted-foreground">HAB</div><div className="text-sm font-semibold">{profile.skill_rating || 50}</div></div>
                </div>
              </div>
            </div>
          </section>

          {/* View Profile Button */}
          <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              Ver perfil completo
            </Button>
          </section>

          {/* Next Match */}
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <NextMatchCard userId={profile.id} />
          </section>

          {/* Meus Jogos Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <SectionCard 
              title="Meus Jogos" 
              onClick={() => navigate('/games')}
            >
              <div className="flex items-center gap-3">
                <div className="stat-icon">
                  <Calendar />
                </div>
                <p className="text-sm text-muted-foreground">Ver partidas e peladas</p>
              </div>
            </SectionCard>
          </section>

          {/* Criar Partida Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <SectionCard 
              title="Criar Partida" 
              onClick={() => navigate('/create-game')}
            >
              <div className="flex items-center gap-3">
                <div className="stat-icon">
                  <Plus />
                </div>
                <p className="text-sm text-muted-foreground">Organize um novo jogo</p>
              </div>
            </SectionCard>
          </section>
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default Home;
