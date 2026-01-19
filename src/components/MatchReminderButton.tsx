import { Button } from '@/components/ui/button';
import { Bell, MessageCircle } from 'lucide-react';

type Match = {
  id: string;
  match_date: string;
  match_time: string;
  location: string | null;
};

type Pelada = {
  name: string;
  location: string;
  max_players: number;
};

interface MatchReminderButtonProps {
  pelada: Pelada;
  match: Match;
  confirmedCount: number;
}

const MatchReminderButton = ({ pelada, match, confirmedCount }: MatchReminderButtonProps) => {
  const generateReminder = () => {
    const matchDate = new Date(match.match_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = matchDate.getTime() === today.getTime();
    const isTomorrow = matchDate.getTime() === tomorrow.getTime();
    
    let dayText = matchDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    if (isToday) dayText = 'HOJE';
    if (isTomorrow) dayText = 'AMANHÃ';
    
    const vagasRestantes = pelada.max_players - confirmedCount;
    
    const message = `⚠️ *LEMBRETE DE PARTIDA*

⚽ ${pelada.name}
📅 ${dayText} - ${matchDate.toLocaleDateString('pt-BR')}
🕐 ${match.match_time.slice(0, 5)}
📍 ${match.location || pelada.location}

👥 ${confirmedCount}/${pelada.max_players} confirmados
${vagasRestantes > 0 ? `\n⚡ Restam ${vagasRestantes} vagas!` : '🔴 LOTADO!'}

Confirme sua presença no app!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button variant="outline" size="sm" onClick={generateReminder} className="flex-1">
      <Bell className="h-4 w-4 mr-2" />
      Lembrete
    </Button>
  );
};

export default MatchReminderButton;
