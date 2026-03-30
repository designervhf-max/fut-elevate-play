import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getSetupRoute } from '@/lib/checkUserSetup';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const route = await getSetupRoute(session.user.id);
        navigate(route);
      } else {
        navigate('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const route = await getSetupRoute(session.user.id);
        navigate(route);
      } else {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center animate-scale-in w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary mb-6">
          ELEVEFUT
        </h1>
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
};

export default Index;
