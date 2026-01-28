import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface FinancialSummaryProps {
  pricePerGame: number;
  confirmedCount: number;
  paidCount: number;
}

const FinancialSummary = ({ pricePerGame, confirmedCount, paidCount }: FinancialSummaryProps) => {
  const pendingCount = confirmedCount - paidCount;
  const totalExpected = pricePerGame * confirmedCount;
  const totalCollected = pricePerGame * paidCount;
  const totalPending = pricePerGame * pendingCount;

  return (
    <div className="fifa-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-sm">Resumo Financeiro</h4>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface/50 rounded-lg p-3">
          <p className="text-xl font-bold text-foreground">
            R$ {totalExpected.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">Esperado</p>
        </div>
        
        <div className="bg-lime/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-lime" />
            <p className="text-xl font-bold text-lime">
              R$ {totalCollected.toFixed(0)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{paidCount} pagos</p>
        </div>
        
        <div className="bg-warning/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-warning" />
            <p className="text-xl font-bold text-warning">
              R$ {totalPending.toFixed(0)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{pendingCount} pendentes</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
