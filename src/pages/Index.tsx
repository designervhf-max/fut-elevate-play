import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getSetupRoute } from '@/lib/checkUserSetup';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const routeUser = async (session: { user: { id: string } } | null) => {
      if (!mounted) return;
      if (!session) {
        navigate('/login');
        return;
      }
      const route = await getSetupRoute(session.user.id);
      if (mounted) navigate(route);
    };

    // Set up listener FIRST so we catch OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        routeUser(session);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      routeUser(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
