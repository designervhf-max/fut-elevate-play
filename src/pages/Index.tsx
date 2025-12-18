import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user has completed setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_game_type')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && !profile.preferred_game_type) {
          navigate('/setup');
        } else {
          navigate('/home');
        }
      } else {
        navigate('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/home');
      } else {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center animate-scale-in w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-display tracking-wider text-primary mb-6">
          ELEVEFUT
        </h1>
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
};

export default Index;
