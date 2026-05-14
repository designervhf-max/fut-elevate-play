import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';

const JoinRequestsBanner = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: admin } = await supabase
        .from('pelada_members').select('pelada_id').eq('user_id', user.id).eq('role', 'admin');
      const ids = (admin ?? []).map((m) => m.pelada_id);
      if (ids.length === 0) return;
      const { count: c } = await supabase
        .from('pelada_join_requests' as any)
        .select('id', { count: 'exact', head: true })
        .in('pelada_id', ids)
        .eq('status', 'pending');
      if (active) setCount(c ?? 0);
    })();
    return () => { active = false; };
  }, []);

  if (count === 0) return null;
  return (
    <button onClick={() => navigate('/join-requests')}
      className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        <span>{count} {count === 1 ? 'nova solicitação' : 'novas solicitações'} de entrada</span>
      </div>
      <span className="text-xs underline">ver</span>
    </button>
  );
};

export default JoinRequestsBanner;
