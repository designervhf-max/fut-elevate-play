import { ChevronRight } from 'lucide-react';

interface SectionCardProps {
  title: string;
  rightLabel?: string;
  onClick?: () => void;
  children: React.ReactNode;
  showArrow?: boolean;
}

const SectionCard = ({ 
  title, 
  rightLabel, 
  onClick, 
  children,
  showArrow = true 
}: SectionCardProps) => {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper 
      className="section-card w-full text-left"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          {rightLabel && <span className="text-sm">{rightLabel}</span>}
          {showArrow && <ChevronRight className="h-4 w-4" />}
        </div>
      </div>
      <div>{children}</div>
    </Wrapper>
  );
};

export default SectionCard;
