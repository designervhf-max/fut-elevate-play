import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  rightLabel?: string;
  onClick?: () => void;
  children: React.ReactNode;
  showArrow?: boolean;
  isExpanded?: boolean;
  collapsedContent?: React.ReactNode;
}

const SectionCard = ({ 
  title, 
  rightLabel, 
  onClick, 
  children,
  showArrow = true,
  isExpanded = false,
  collapsedContent
}: SectionCardProps) => {
  const isExpandable = onClick !== undefined && collapsedContent !== undefined;
  
  return (
    <div className="section-card w-full text-left">
      {/* Header - clickable */}
      <button
        className="w-full flex items-center justify-between mb-3"
        onClick={onClick}
        disabled={!onClick}
      >
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          {rightLabel && <span className="text-sm">{rightLabel}</span>}
          {showArrow && (
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform duration-300 ease-out",
                isExpanded && "rotate-90"
              )} 
            />
          )}
        </div>
      </button>
      
      {/* Content with animation */}
      {isExpandable ? (
        <>
          {/* Collapsed content */}
          <div 
            className={cn(
              "grid transition-all duration-300 ease-out",
              isExpanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            )}
          >
            <div className="overflow-hidden">
              {collapsedContent}
            </div>
          </div>
          
          {/* Expanded content */}
          <div 
            className={cn(
              "grid transition-all duration-300 ease-out",
              isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              {children}
            </div>
          </div>
        </>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};

export default SectionCard;
