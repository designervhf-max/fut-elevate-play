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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-5xl font-display tracking-wider neon-text mb-4">
          ELEVEFUT
        </h1>
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
};

export default Index;
