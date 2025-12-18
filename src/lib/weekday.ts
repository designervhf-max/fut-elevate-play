// Weekday utilities for recurring games

export const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export function getWeekdayLabel(weekday: number): string {
  return WEEKDAYS.find(w => w.value === weekday)?.label || '';
}

export function getWeekdayShort(weekday: number): string {
  return WEEKDAYS.find(w => w.value === weekday)?.short || '';
}

/**
 * Calculate the next occurrence of a given weekday
 * @param weekday 0-6 (Sunday-Saturday)
 * @param time Optional time string (HH:mm) to determine if today's occurrence has passed
 * @returns Date of the next occurrence
 */
export function getNextOccurrence(weekday: number, time?: string): Date {
  const now = new Date();
  const currentWeekday = now.getDay();
  let daysUntilNext = (weekday - currentWeekday + 7) % 7;
  
  // If it's the same day, check if the time has passed
  if (daysUntilNext === 0 && time) {
    const [hours, minutes] = time.split(':').map(Number);
    const gameTime = new Date(now);
    gameTime.setHours(hours, minutes, 0, 0);
    
    if (now > gameTime) {
      daysUntilNext = 7; // Next week
    }
  }
  
  // If daysUntilNext is 0 and no time check needed, it's today
  if (daysUntilNext === 0 && !time) {
    daysUntilNext = 0;
  }
  
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntilNext);
  nextDate.setHours(0, 0, 0, 0);
  
  return nextDate;
}

/**
 * Format the next occurrence for display
 * @param weekday 0-6 (Sunday-Saturday)
 * @param time Optional time string (HH:mm)
 * @returns Formatted string like "Próxima: 25/12"
 */
export function formatNextOccurrence(weekday: number, time?: string): string {
  const nextDate = getNextOccurrence(weekday, time);
  return nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
