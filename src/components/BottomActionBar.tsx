import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'sport' | 'outline' | 'ghost' | 'destructive';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

interface BottomActionBarProps {
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
  className?: string;
}

const BottomActionBar = ({
  primaryAction,
  secondaryAction,
  className,
}: BottomActionBarProps) => {
  if (!primaryAction && !secondaryAction) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border',
        'px-4 py-3 pb-safe',
        className
      )}
    >
      <div className="max-w-md mx-auto flex gap-3">
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant || 'outline'}
            className="flex-1 h-12 font-semibold"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.loading}
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'sport'}
            className="flex-1 h-12 font-semibold"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BottomActionBar;
