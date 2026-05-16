// Normalizes legacy match statuses to the new lifecycle values
export type MatchPhase = 'criada' | 'confirmacoes_abertas' | 'em_andamento' | 'encerrada';

export function getMatchPhase(status: string | null | undefined, openForConfirmation?: boolean): MatchPhase {
  switch (status) {
    case 'criada':
      return 'criada';
    case 'confirmacoes_abertas':
      return 'confirmacoes_abertas';
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
