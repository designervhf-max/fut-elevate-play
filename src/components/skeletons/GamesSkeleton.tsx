import { Skeleton } from '@/components/ui/skeleton';

export const GamesSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 glass px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-7 w-36" />
          </div>
        </header>

        <main className="p-4">
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="fifa-card p-4 animate-fade-in" 
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded" />
                  </div>
                  
                  {/* Next Match Box */}
                  <div className="mb-3 p-3 bg-surface/50 rounded-lg border border-border/50">
                    <Skeleton className="h-3 w-24 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  
                  {/* Day & Time */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default GamesSkeleton;
