import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMatchReminders() {
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkUpcomingMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Get matches where user is confirmed participant
      const { data: participants } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)
        .eq('status', 'Confirmado');

      if (!participants?.length) return;

      const matchIds = participants.map(p => p.match_id);

      const { data: matches } = await supabase
        .from('matches')
        .select('id, match_date, match_time, location')
        .in('id', matchIds)
        .eq('status', 'scheduled');

      if (!matches?.length) return;

      for (const match of matches) {
        const matchDateTime = new Date(`${match.match_date}T${match.match_time}`);
        const timeDiff = matchDateTime.getTime() - now.getTime();
        const twoHoursMs = 2 * 60 * 60 * 1000;

        // Notify if match is within 2 hours
        if (timeDiff > 0 && timeDiff <= twoHoursMs) {
          const notifiedKey = `match-notified-${match.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            const hours = Math.floor(timeDiff / (60 * 60 * 1000));
            const mins = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
            const timeLabel = hours > 0 ? `${hours}h${mins}min` : `${mins} minutos`;

            new Notification('⚽ Partida em breve!', {
              body: `Sua pelada começa em ${timeLabel}${match.location ? ` — ${match.location}` : ''}`,
              icon: '/favicon.ico',
              tag: `match-${match.id}`,
            });
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      }
    };

    // Check immediately and every 15 minutes
    checkUpcomingMatches();
    const interval = setInterval(checkUpcomingMatches, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
