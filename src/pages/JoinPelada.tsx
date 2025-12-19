import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarDays, MapPin, Users, Clock } from 'lucide-react';
import { getWeekdayLabel } from '@/lib/weekday';

type Pelada = {
  id: string;
  name: string;
  location: string;
  weekday: number;
  time: string;
  game_type: string;
  max_players: number;
};

const JoinPelada = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Save pelada id to redirect after registration
        localStorage.setItem('join_pelada_id', id || '');
        navigate('/register');
        return;
      }

      setUserId(session.user.id);

      // Fetch pelada details (use service role via edge function if needed, or direct query)
      const { data: peladaData, error } = await supabase
        .from('peladas')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !peladaData) {
        toast({
          title: 'Erro',
          description: 'Pelada nao encontrada',
          variant: 'destructive',
        });
        navigate('/games');
        return;
      }

      setPelada(peladaData as Pelada);

      // Check if already a member
      const { data: memberData } = await supabase
        .from('pelada_members')
        .select('id')
        .eq('pelada_id', id)
        .eq('user_id', session.user.id)
        .single();

      if (memberData) {
        setIsMember(true);
      }

      setLoading(false);
    };

    checkAuthAndFetch();
  }, [id, navigate, toast]);

  const handleJoin = async () => {
    if (!userId || !pelada) return;

    setJoining(true);

    const { error } = await supabase
      .from('pelada_members')
      .insert({
        pelada_id: pelada.id,
        user_id: userId,
        role: 'member',
      });

    setJoining(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel entrar na pelada',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Voce entrou na pelada!' });
    navigate(`/pelada/${pelada.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pelada) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Pelada Card */}
        <div className="fifa-card p-6 text-center">
          <h1 className="text-3xl font-display tracking-wider text-primary mb-2">
            {pelada.name}
          </h1>
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
            {pelada.game_type}
          </span>

          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              {getWeekdayLabel(pelada.weekday)}
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              {pelada.time.slice(0, 5)}
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              {pelada.location}
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Max: {pelada.max_players} jogadores
            </div>
          </div>
        </div>

        {/* Action */}
        {isMember ? (
          <div className="space-y-3">
            <p className="text-center text-muted-foreground">Voce ja faz parte desta pelada!</p>
            <Button
              variant="sport"
              className="w-full"
              onClick={() => navigate(`/pelada/${pelada.id}`)}
            >
              Ver Pelada
            </Button>
          </div>
        ) : (
          <Button
            variant="sport"
            size="lg"
            className="w-full"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Entrar na Pelada'
            )}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/games')}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
};

export default JoinPelada;
