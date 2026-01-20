import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import GamesSkeleton from '@/components/skeletons/GamesSkeleton';
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getWeekdayLabel, formatNextOccurrence } from '@/lib/weekday';
import { usePeladas, PeladaWithDetails } from '@/hooks/usePeladas';

const Games = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
    };
    checkSession();
  }, [navigate]);

  const { data: peladas = [], isLoading: loading } = usePeladas(userId);
  const invites: PeladaWithDetails[] = []; // For future use

  const getStatusDisplay = (userMatchStatus: string | null) => {
    if (!userMatchStatus) {
      return { label: 'Aguardando confirmação', color: 'text-yellow-500', icon: AlertCircle };
    }
    switch (userMatchStatus) {
      case 'Confirmado':
        return { label: 'Confirmado', color: 'text-green-500', icon: CheckCircle };
      case 'Pendente':
        return { label: 'Aguardando confirmação', color: 'text-yellow-500', icon: AlertCircle };
      default:
        return { label: userMatchStatus, color: 'text-muted-foreground', icon: AlertCircle };
    }
  };

  if (loading || !userId) {
    return <GamesSkeleton />;
  }

  const isEmpty = peladas.length === 0 && invites.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
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
              NENHUMA PELADA
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Você ainda não participa de nenhuma pelada.
            </p>
            <Button
              variant="sport"
              size="lg"
              onClick={() => navigate('/create-pelada')}
            >
              <Plus className="h-5 w-5 mr-2" />
              CRIAR PRIMEIRA PELADA
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invites Section (for future use) */}
            {invites.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Convites Pendentes
                </h3>
                <div className="space-y-3">
                  {/* Invite cards would go here */}
                </div>
              </section>
            )}

            {/* Active Peladas */}
            <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Minhas Peladas
              </h3>
              <div className="space-y-3">
                {peladas.map((pelada, index) => {
                  const status = getStatusDisplay(pelada.userMatchStatus);
                  const StatusIcon = status.icon;
                  
                  // Calculate next match date
                  let nextMatchDisplay = 'Sem partida agendada';
                  if (pelada.nextMatch) {
                    const matchDate = new Date(pelada.nextMatch.match_date + 'T00:00:00');
                    nextMatchDisplay = `${matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${pelada.nextMatch.match_time.slice(0, 5)}`;
                  } else {
                    // Show calculated next occurrence based on weekday
                    nextMatchDisplay = `Próxima: ${formatNextOccurrence(pelada.weekday, pelada.time)}`;
                  }

                  return (
                    <div 
                      key={pelada.id} 
                      className="fifa-card p-4 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{pelada.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {pelada.game_type}
                          </span>
                        </div>
                        {pelada.member.role === 'admin' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      {/* Next Match */}
                      <div className="mb-3 p-3 bg-surface/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Próxima Partida</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {nextMatchDisplay}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          <span className={`text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="flex items-center gap-1 text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {getWeekdayLabel(pelada.weekday)} - {pelada.time.slice(0, 5)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        {pelada.location}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Máx: {pelada.max_players}
                        </span>
                        <Button 
                          variant="sport" 
                          size="sm"
                          onClick={() => navigate(`/pelada/${pelada.id}`)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
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
            onClick={() => navigate('/create-pelada')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      <BottomNav />
      </div>
    </div>
  );
};

export default Games;
