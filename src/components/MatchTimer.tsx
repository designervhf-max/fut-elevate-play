import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface MatchTimerProps {
  initialTime?: number; // in seconds, for resuming
  onTimeUpdate?: (seconds: number) => void;
  isRunning?: boolean;
  onRunningChange?: (running: boolean) => void;
}

const MatchTimer = ({ 
  initialTime = 0, 
  onTimeUpdate,
  isRunning: externalIsRunning,
  onRunningChange 
}: MatchTimerProps) => {
  const [seconds, setSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(externalIsRunning ?? false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external running state
  useEffect(() => {
    if (externalIsRunning !== undefined) {
      setIsRunning(externalIsRunning);
    }
  }, [externalIsRunning]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1;
          onTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    onRunningChange?.(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    onRunningChange?.(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    onRunningChange?.(false);
    onTimeUpdate?.(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer Display */}
      <div className="relative">
        <div className="w-40 h-40 rounded-full border-4 border-primary/30 flex items-center justify-center bg-gradient-to-br from-surface to-background">
          <div className="text-center">
            <span className="text-5xl font-display font-bold text-foreground tracking-wider">
              {formatTime(seconds)}
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {isRunning ? 'Em andamento' : 'Pausado'}
            </p>
          </div>
        </div>
        {isRunning && (
          <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <Button
            variant="sport"
            size="lg"
            onClick={handleStart}
            className="min-w-[120px]"
          >
            <Play className="h-5 w-5 mr-2" />
            {seconds === 0 ? 'Iniciar' : 'Retomar'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onClick={handlePause}
            className="min-w-[120px]"
          >
            <Pause className="h-5 w-5 mr-2" />
            Pausar
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="lg"
          onClick={handleReset}
          disabled={seconds === 0}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MatchTimer;
