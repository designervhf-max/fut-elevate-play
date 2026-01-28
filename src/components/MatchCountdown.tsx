import { useMemo } from 'react';
import { CalendarClock, Clock } from 'lucide-react';

interface MatchCountdownProps {
  matchDate: string;
  matchTime: string;
  variant?: 'badge' | 'full';
}

const MatchCountdown = ({ matchDate, matchTime, variant = 'badge' }: MatchCountdownProps) => {
  const { label, color, daysUntil } = useMemo(() => {
    const now = new Date();
    const matchDateTime = new Date(`${matchDate}T${matchTime}`);
    const diffMs = matchDateTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      return { label: 'ENCERRADO', color: 'bg-muted text-muted-foreground', daysUntil: -1 };
    }

    if (diffHours <= 0) {
      return { label: 'AGORA', color: 'bg-primary text-primary-foreground', daysUntil: 0 };
    }

    if (diffHours <= 2) {
      return { label: 'EM BREVE', color: 'bg-warning text-warning-foreground', daysUntil: 0 };
    }

    if (diffDays === 0) {
      return { label: 'HOJE', color: 'bg-primary text-primary-foreground', daysUntil: 0 };
    }

    if (diffDays === 1) {
      return { label: 'AMANHÃ', color: 'bg-lime text-lime-foreground', daysUntil: 1 };
    }

    if (diffDays <= 7) {
      return { 
        label: `EM ${diffDays} DIAS`, 
        color: 'bg-surface text-foreground border border-border', 
        daysUntil: diffDays 
      };
    }

    return { 
      label: `EM ${diffDays} DIAS`, 
      color: 'bg-muted text-muted-foreground', 
      daysUntil: diffDays 
    };
  }, [matchDate, matchTime]);

  if (variant === 'badge') {
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color} inline-flex items-center gap-1`}>
        <CalendarClock className="h-3 w-3" />
        {label}
      </span>
    );
  }

  // Full variant with more details
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5" />
        <div>
          <p className="font-bold text-sm">{label}</p>
          {daysUntil > 1 && (
            <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {new Date(`${matchDate}T${matchTime}`).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'short',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCountdown;
