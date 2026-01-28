import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: string;
  size?: 'sm' | 'md';
  className?: string;
}

const positionAbbreviations: Record<string, string> = {
  'Goleiro': 'GOL',
  'Fixo': 'FIX',
  'Ala': 'ALA',
  'Pivô': 'PIV',
  'Zagueiro': 'ZAG',
  'Meia': 'MEI',
  'Atacante': 'ATA',
};

const positionColors: Record<string, string> = {
  'Goleiro': 'bg-orange-500/90',
  'Fixo': 'bg-blue-500/90',
  'Ala': 'bg-green-500/90',
  'Pivô': 'bg-red-500/90',
  'Zagueiro': 'bg-blue-600/90',
  'Meia': 'bg-emerald-500/90',
  'Atacante': 'bg-rose-500/90',
};

const PositionBadge = ({ position, size = 'sm', className }: PositionBadgeProps) => {
  const abbreviation = positionAbbreviations[position] || position.substring(0, 3).toUpperCase();
  const bgColor = positionColors[position] || 'bg-muted';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  return (
    <span
      className={cn(
        'font-bold text-white rounded-sm uppercase tracking-wide',
        bgColor,
        sizeClasses[size],
        className
      )}
    >
      {abbreviation}
    </span>
  );
};

export default PositionBadge;
