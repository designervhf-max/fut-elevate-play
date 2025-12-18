import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Calendar,
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

type Game = Database['public']['Tables']['games']['Row'];
type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type GameWithParticipants = Game & {
  participants: (GameParticipant & { profile: Profile })[];
  creator: Profile;
};

type FilterType = 'all' | 'future' | 'past';

const Games = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithParticipants[]>([]);
  const [invites, setInvites] = useState<GameWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
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
        .order('date', { ascending: true });

      if (!error && gamesData) {
        const now = new Date();
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

    // Refresh data
    window.location.reload();
  };

  const handleDeclineInvite = async (gameId: string) => {
    if (!userId) return;

    await supabase
      .from('game_participants')
      .update({ status: 'Recusado' })
      .eq('game_id', gameId)
      .eq('user_id', userId);

    // Refresh data
    window.location.reload();
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

  const filteredGames = games.filter(game => {
    const gameDate = new Date(game.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (filter === 'future') return gameDate >= now && game.status !== 'Finalizado';
    if (filter === 'past') return gameDate < now || game.status === 'Finalizado';
    return true;
  });

  const futureGames = filteredGames.filter(g => {
    const gameDate = new Date(g.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return gameDate >= now && g.status !== 'Finalizado';
  });

  const pastGames = filteredGames.filter(g => {
    const gameDate = new Date(g.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return gameDate < now || g.status === 'Finalizado';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = games.length === 0 && invites.length === 0;

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
              <Calendar className="h-10 w-10 text-muted-foreground" />
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
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-up">
              {(['all', 'future', 'past'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all' && 'Todos'}
                  {f === 'future' && 'Futuros'}
                  {f === 'past' && 'Passados'}
                </button>
              ))}
            </div>

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
                          <h4 className="font-semibold">{game.creator.name}</h4>
                          <p className="text-sm text-muted-foreground">{game.game_type}</p>
                        </div>
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                          Convite
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(game.date).toLocaleDateString('pt-BR')}
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

            {/* Future Games */}
            {futureGames.length > 0 && (filter === 'all' || filter === 'future') && (
              <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Próximos Jogos
                </h3>
                <div className="space-y-3">
                  {futureGames.map((game) => (
                    <div key={game.id} className="fifa-card p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs bg-surface px-2 py-1 rounded text-primary">
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
                          <Calendar className="h-4 w-4 text-primary" />
                          {new Date(game.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {game.time.slice(0, 5)}
                        </span>
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
                        <Button variant="ghost" size="sm" className="text-primary">
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Games (History) */}
            {pastGames.length > 0 && (filter === 'all' || filter === 'past') && (
              <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Histórico de Jogos
                </h3>
                <div className="space-y-3">
                  {pastGames.map((game) => {
                    const userParticipation = game.participants.find(p => p.user_id === userId);
                    return (
                      <div key={game.id} className="fifa-card p-4 opacity-80">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs bg-surface px-2 py-1 rounded text-muted-foreground">
                              {game.game_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Finalizado</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm mb-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(game.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {game.location}
                          </span>
                        </div>
                        {userParticipation && (
                          <div className="flex items-center gap-4 text-sm border-t border-border pt-3 mt-3">
                            <div className="text-center">
                              <div className="text-lg font-display neon-text">{userParticipation.goals || 0}</div>
                              <div className="text-xs text-muted-foreground">Gols</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-display neon-text">{userParticipation.assists || 0}</div>
                              <div className="text-xs text-muted-foreground">Assist.</div>
                            </div>
                            {userParticipation.rating && (
                              <div className="text-center">
                                <div className="text-lg font-display text-yellow-500">{userParticipation.rating.toFixed(1)}</div>
                                <div className="text-xs text-muted-foreground">Nota</div>
                              </div>
                            )}
                            <Button variant="ghost" size="sm" className="ml-auto text-primary">
                              Ver desempenho
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isEmpty && (
        <div className="fixed bottom-6 right-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Button
            variant="neon"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => navigate('/create-game')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Games;
