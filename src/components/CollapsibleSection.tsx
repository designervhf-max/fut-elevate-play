import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  badgeColor?: string;
  className?: string;
}

const CollapsibleSection = ({
  title,
  count,
  defaultOpen = true,
  children,
  icon,
  badgeColor = 'bg-primary',
  className,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 bg-card/50 rounded-lg hover:bg-card/80 transition-colors">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="font-semibold text-sm">{title}</span>
          {count !== undefined && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full text-white',
                badgeColor
              )}
            >
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="space-y-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;
