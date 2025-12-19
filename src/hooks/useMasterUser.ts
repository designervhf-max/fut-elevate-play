import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Master user email - this user has access to all features for testing
const MASTER_USER_EMAIL = 'master@elevefut.com';

export const useMasterUser = () => {
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMasterStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === MASTER_USER_EMAIL) {
        setIsMaster(true);
      }
      
      setLoading(false);
    };

    checkMasterStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsMaster(session?.user?.email === MASTER_USER_EMAIL);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isMaster, loading };
};

export const MASTER_EMAIL = MASTER_USER_EMAIL;
