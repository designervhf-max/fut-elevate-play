// Normalizes legacy match statuses to the new lifecycle values
export type MatchPhase =
  | 'criada'
  | 'confirmacoes_abertas'
  | 'times_sorteados'
  | 'em_andamento'
  | 'encerrada';

// Statuses that mean the match is still "open" (not finished)
export const OPEN_MATCH_STATUSES = [
  'scheduled',
  'in_progress',
  'criada',
  'confirmacoes_abertas',
  'times_sorteados',
  'em_andamento',
] as const;

// Statuses where the game is live/drawn — must show even if match_date < today
export const LIVE_MATCH_STATUSES = ['em_andamento', 'in_progress', 'times_sorteados'] as const;

export function getMatchPhase(status: string | null | undefined, openForConfirmation?: boolean): MatchPhase {
  switch (status) {
    case 'criada':
      return 'criada';
    case 'confirmacoes_abertas':
      return 'confirmacoes_abertas';
    case 'times_sorteados':
      return 'times_sorteados';
    case 'em_andamento':
    case 'in_progress':
      return 'em_andamento';
    case 'encerrada':
    case 'finished':
      return 'encerrada';
    case 'scheduled':
      return openForConfirmation ? 'confirmacoes_abertas' : 'criada';
    default:
      return 'criada';
  }
}

export const isFinished = (status: string | null | undefined) =>
  getMatchPhase(status) === 'encerrada';
