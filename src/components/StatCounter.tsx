import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatCounter = ({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  icon,
  iconColor = 'text-primary',
  size = 'md',
}: StatCounterProps) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'h-8 w-8',
      value: 'text-xl min-w-[2.5rem]',
      label: 'text-xs',
      icon: 'h-4 w-4',
    },
    md: {
      button: 'h-10 w-10',
      value: 'text-2xl min-w-[3rem]',
      label: 'text-sm',
      icon: 'h-5 w-5',
    },
    lg: {
      button: 'h-12 w-12',
      value: 'text-3xl min-w-[3.5rem]',
      label: 'text-base',
      icon: 'h-6 w-6',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('flex items-center gap-1', iconColor)}>
        {icon && <span className={classes.icon}>{icon}</span>}
        <span className={cn('font-medium', classes.label)}>{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            classes.button,
            'rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10',
            'transition-all duration-200'
          )}
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className={cn('font-bold tabular-nums text-center', classes.value)}>
          {value}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className={cn(
            classes.button,
            'rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10',
            'transition-all duration-200'
          )}
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StatCounter;
