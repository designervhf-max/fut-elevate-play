import { Check, Clock } from 'lucide-react';

interface PaymentBadgeProps {
  paid: boolean;
  price?: number;
  onClick?: () => void;
  interactive?: boolean;
}

const PaymentBadge = ({ paid, price, onClick, interactive = false }: PaymentBadgeProps) => {
  const baseClasses = 'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors';
  
  const paidClasses = paid
    ? 'bg-lime/20 text-lime'
    : 'bg-warning/20 text-warning';

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:opacity-80 active:scale-95'
    : '';

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  return (
    <span
      className={`${baseClasses} ${paidClasses} ${interactiveClasses}`}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {paid ? (
        <>
          <Check className="h-3 w-3" />
          Pago
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          {price ? `R$ ${price.toFixed(2)}` : 'Pendente'}
        </>
      )}
    </span>
  );
};

export default PaymentBadge;
