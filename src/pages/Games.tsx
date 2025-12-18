import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  Loader2,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { getWeekdayLabel, formatNextOccurrence } from '@/lib/weekday';

type Game = Database['public']['Tables']['games']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type GameWithParticipants = Game & {
  participants: (GameParticipant & { profile: Profile })[];
  creator: Profile;
};

const Games = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithParticipants[]>([]);
  const [invites, setInvites] = useState<GameWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);

      // Fetch all games where user is creator or participant
      const { data: participantGames } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', session.user.id);

      const gameIds = participantGames?.map(p => p.game_id) || [];

      const { data: gamesData, error } = await supabase
        .from('games')
        .select(`
          *,
          creator:profiles!games_creator_id_fkey(*),
          participants:game_participants(
            *,
            profile:profiles(*)
          )
        `)
        .or(`creator_id.eq.${session.user.id},id.in.(${gameIds.join(',') || 'null'})`)
        .order('weekday', { ascending: true });

      if (!error && gamesData) {
        const allGames = gamesData as unknown as GameWithParticipants[];
        
        // Separate invites (pending status for current user)
        const userInvites = allGames.filter(game => 
          game.participants.some(p => 
            p.user_id === session.user.id && p.status === 'Pendente'
          ) && game.creator_id !== session.user.id
        );
        
        // Rest of games
        const userGames = allGames.filter(game => 
          !userInvites.includes(game)
        );

        setInvites(userInvites);
        setGames(userGames);
      }

      setLoading(false);
    };

    fetchGames();
  }, [navigate]);

  const handleAcceptInvite = async (gameId: string) => {
    if (!userId) return;

    await supabase
      .from('game_participants')
      .update({ status: 'Confirmado' })
      .eq('game_id', gameId)
      .eq('user_id', userId);

    // Move from invites to games with updated status
    const acceptedGame = invites.find(g => g.id === gameId);
    if (acceptedGame) {
      const updatedGame = {
        ...acceptedGame,
        participants: acceptedGame.participants.map(p =>
          p.user_id === userId ? { ...p, status: 'Confirmado' as const } : p
        ),
      };
      setInvites(prev => prev.filter(g => g.id !== gameId));
      setGames(prev => [...prev, updatedGame]);
    }
  };

  const handleDeclineInvite = async (gameId: string) => {
    if (!userId) return;

    await supabase
      .from('game_participants')
      .update({ status: 'Recusado' })
      .eq('game_id', gameId)
      .eq('user_id', userId);

    // Remove from invites list
    setInvites(prev => prev.filter(g => g.id !== gameId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'text-green-500';
      case 'Pendente':
        return 'text-yellow-500';
      case 'Cancelado':
        return 'text-red-500';
      case 'Finalizado':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pendente':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Cancelado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Finalizado':
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  const isEmpty = games.length === 0 && invites.length === 0;

  // Active games (confirmed status)
  const activeGames = games.filter(g => g.status === 'Confirmado');
  
  // Inactive/cancelled games
  const inactiveGames = games.filter(g => g.status !== 'Confirmado');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">MEUS JOGOS</h1>
        </div>
      </header>

      <main className="p-4">
        {isEmpty ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center mb-6">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display tracking-wider mb-2">
              NENHUM JOGO
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Você ainda não tem jogos marcados.
            </p>
            <Button
              variant="sport"
              size="lg"
              onClick={() => navigate('/create-game')}
            >
              <Plus className="h-5 w-5 mr-2" />
              CRIAR PRIMEIRA PARTIDA
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invites Section */}
            {invites.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Convites Pendentes
                </h3>
                <div className="space-y-3">
                  {invites.map((game) => (
                    <div key={game.id} className="fifa-card p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{game.name}</h4>
                          <p className="text-sm text-muted-foreground">{game.game_type}</p>
                        </div>
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                          Convite
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {getWeekdayLabel(game.weekday)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {game.time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        {game.location}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="sport"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptInvite(game.id)}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeclineInvite(game.id)}
                        >
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Active Games */}
            {activeGames.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Minhas Peladas
                </h3>
                <div className="space-y-3">
                  {activeGames.map((game) => (
                    <div key={game.id} className="fifa-card p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{game.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {game.game_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(game.status || 'Pendente')}
                          <span className={`text-xs ${getStatusColor(game.status || 'Pendente')}`}>
                            {game.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="flex items-center gap-1 text-foreground">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {getWeekdayLabel(game.weekday)}
                        </span>
                        <span className="flex items-center gap-1 text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {game.time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Próxima: {formatNextOccurrence(game.weekday, game.time)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        {game.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {game.participants.filter(p => p.status === 'Confirmado').length}/{game.max_players}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => navigate(`/game/${game.id}`)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inactive Games */}
            {inactiveGames.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Peladas Inativas
                </h3>
                <div className="space-y-3">
                  {inactiveGames.map((game) => (
                    <div key={game.id} className="fifa-card p-4 opacity-60">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{game.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {game.game_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(game.status || 'Cancelado')}
                          <span className={`text-xs ${getStatusColor(game.status || 'Cancelado')}`}>
                            {game.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {getWeekdayLabel(game.weekday)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {game.location}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary"
                        onClick={() => navigate(`/game/${game.id}`)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isEmpty && (
        <div className="fixed bottom-20 right-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Button
            variant="sport"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => navigate('/create-game')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Games;
