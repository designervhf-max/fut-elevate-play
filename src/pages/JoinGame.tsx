import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  CheckCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { getWeekdayLabel, formatNextOccurrence } from '@/lib/weekday';

type Game = Database['public']['Tables']['games']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type GameWithCreator = Game & {
  creator: Profile;
  participants: { user_id: string | null; status: string | null }[];
};

const JoinGame = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<GameWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);

      // Fetch game details
      const { data: gameData, error } = await supabase
        .from('games')
        .select(`
          *,
          creator:profiles!games_creator_id_fkey(*),
          participants:game_participants(user_id, status)
        `)
        .eq('id', id)
        .single();

      if (error || !gameData) {
        toast({
          title: 'Erro',
          description: 'Jogo não encontrado',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setGame(gameData as unknown as GameWithCreator);

      // Check if user is already a participant
      if (session?.user?.id) {
        const alreadyJoined = gameData.participants?.some(
          (p: { user_id: string | null }) => p.user_id === session.user.id
        );
        setIsParticipant(alreadyJoined);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate, toast]);

  const handleJoin = async () => {
    if (!userId || !game) return;
    
    setJoining(true);

    try {
      const { error } = await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: userId,
          status: 'Pendente',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Aviso',
            description: 'Você já está neste jogo',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Você entrou no jogo. Confirme sua presença!',
        });
      }

      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível entrar no jogo',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLoginRedirect = () => {
    // Store the game ID to redirect back after login
    sessionStorage.setItem('joinGameId', id || '');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) return null;

  const confirmedCount = game.participants?.filter(p => p.status === 'Confirmado').length || 0;
  const isFull = confirmedCount >= game.max_players;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-sport rounded-full flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-2xl tracking-wider text-primary">
            CONVITE PARA PELADA
          </h1>
        </div>

        {/* Game Info Card */}
        <div className="fifa-card p-6 space-y-4">
          <div className="text-center border-b border-border pb-4">
            <h2 className="text-xl font-bold">{game.name}</h2>
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
              {game.game_type}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">{getWeekdayLabel(game.weekday)}</span>
                <p className="text-xs text-muted-foreground">
                  Próxima: {formatNextOccurrence(game.weekday, game.time)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">{game.time.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">{game.location}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {confirmedCount}/{game.max_players} confirmados
              </span>
              {isFull && (
                <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                  LOTADO
                </span>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Organizado por</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                {game.creator.avatar_url ? (
                  <img
                    src={game.creator.avatar_url}
                    alt={game.creator.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {game.creator.name.charAt(0)}
                  </span>
                )}
              </div>
              <p className="font-semibold">{game.creator.name}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!userId ? (
            <>
              <Button
                variant="sport"
                className="w-full"
                onClick={handleLoginRedirect}
              >
                <LogIn className="h-5 w-5 mr-2" />
                Fazer Login para Participar
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  sessionStorage.setItem('joinGameId', id || '');
                  navigate('/register');
                }}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Criar Conta
              </Button>
            </>
          ) : isParticipant ? (
            <Button
              variant="sport"
              className="w-full"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Ver Detalhes do Jogo
            </Button>
          ) : game.status === 'Finalizado' ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Esta partida já foi finalizada</p>
            </div>
          ) : isFull ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Este jogo já está lotado</p>
            </div>
          ) : (
            <Button
              variant="sport"
              className="w-full"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Entrar no Jogo
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
