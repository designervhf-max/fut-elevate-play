import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react';

interface ReqRow {
  id: string;
  pelada_id: string;
  user_id: string;
  status: string;
  created_at: string;
  pelada_name?: string;
  user_name?: string;
}

const JoinRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    // Find peladas where user is admin or creator
    const { data: myAdmin } = await supabase
      .from('pelada_members').select('pelada_id').eq('user_id', user.id).eq('role', 'admin');
    const peladaIds = (myAdmin ?? []).map((m) => m.pelada_id);
    if (peladaIds.length === 0) { setRows([]); setLoading(false); return; }

    const { data: reqs } = await supabase
      .from('pelada_join_requests' as any)
      .select('id, pelada_id, user_id, status, created_at')
      .in('pelada_id', peladaIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const list = (reqs as any[]) ?? [];
    if (list.length === 0) { setRows([]); setLoading(false); return; }

    const userIds = [...new Set(list.map((r) => r.user_id))];
    const pIds = [...new Set(list.map((r) => r.pelada_id))];
    const [{ data: profiles }, { data: peladas }] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', userIds),
      supabase.from('peladas').select('id, name').in('id', pIds),
    ]);

    const profMap: Record<string, string> = {};
    profiles?.forEach((p) => (profMap[p.id] = p.name));
    const pMap: Record<string, string> = {};
    peladas?.forEach((p) => (pMap[p.id] = p.name));

    setRows(list.map((r) => ({ ...r, user_name: profMap[r.user_id] ?? 'Jogador', pelada_name: pMap[r.pelada_id] ?? 'Pelada' })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const respond = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id);
    const { error } = await supabase.from('pelada_join_requests' as any).update({ status }).eq('id', id);
    setActing(null);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: status === 'approved' ? 'Jogador aprovado!' : 'Solicitação recusada' });
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-xl font-display tracking-wider">SOLICITAÇÕES</h1>
      </header>
      <div className="p-4 space-y-3">
        {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!loading && rows.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma solicitação pendente</p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="p-4 rounded-lg bg-surface border border-border space-y-2">
            <div>
              <p className="font-semibold">{r.user_name}</p>
              <p className="text-xs text-muted-foreground">quer entrar em <span className="text-primary">{r.pelada_name}</span></p>
            </div>
            <div className="flex gap-2">
              <Button variant="sport" size="sm" className="flex-1" onClick={() => respond(r.id, 'approved')} disabled={acting === r.id}>
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => respond(r.id, 'rejected')} disabled={acting === r.id}>
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequests;
