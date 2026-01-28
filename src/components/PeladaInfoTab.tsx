import { CalendarDays, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { getWeekdayLabel } from '@/lib/weekday';

interface PeladaInfoTabProps {
  pelada: {
    weekday: number;
    time: string;
    location: string;
    game_type: string;
    max_players: number;
    price_per_game?: number | null;
  };
  isAdmin: boolean;
}

const PeladaInfoTab = ({ pelada, isAdmin }: PeladaInfoTabProps) => {
  return (
    <div className="space-y-4">
      <div className="fifa-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
            {pelada.game_type}
          </span>
          {isAdmin && (
            <span className="text-xs bg-surface text-muted-foreground px-3 py-1 rounded-full">
              Administrador
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dia da Semana</p>
              <p className="font-medium">{getWeekdayLabel(pelada.weekday)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horário</p>
              <p className="font-medium">{pelada.time.slice(0, 5)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local</p>
              <p className="font-medium">{pelada.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Máximo de Jogadores</p>
              <p className="font-medium">{pelada.max_players} jogadores</p>
            </div>
          </div>

          {pelada.price_per_game && pelada.price_per_game > 0 && (
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 rounded-lg bg-lime/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-lime" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor por Jogo</p>
                <p className="font-medium text-lime">R$ {pelada.price_per_game.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeladaInfoTab;
