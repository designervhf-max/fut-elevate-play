import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/PlayerCard';
import OverallStats from '@/components/OverallStats';
import BottomNav from '@/components/BottomNav';
import { Calendar, Plus, User, LogOut, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Home = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error || !profileData) {
        navigate('/login');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display tracking-wider text-primary">
            ELEVEFUT
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6">
        {/* Player Card Section */}
        <section className="animate-slide-up">
          <PlayerCard profile={profile} />
        </section>

        {/* Overall Stats Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <OverallStats profile={profile} />
        </section>

        {/* View Profile Button */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Ver perfil
          </Button>
        </section>

        {/* Action Buttons */}
        <section className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Ações
          </h3>
          <Button
            variant="dark"
            size="lg"
            className="w-full justify-start"
            onClick={() => navigate('/games')}
          >
            <Calendar className="h-5 w-5 mr-3 text-primary" />
            Ver meus jogos
          </Button>
          <Button
            variant="sport"
            size="lg"
            className="w-full justify-start"
            onClick={() => navigate('/create-game')}
          >
            <Plus className="h-5 w-5 mr-3" />
            Criar partida
          </Button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
