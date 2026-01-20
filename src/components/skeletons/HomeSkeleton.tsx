import { Skeleton } from '@/components/ui/skeleton';

export const HomeSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 glass px-4 py-3 safe-top">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Profile Summary Skeleton */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-12 mb-2" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-12" />
                  <div className="h-8 w-px bg-border" />
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-3 w-8 mb-1" />
                        <Skeleton className="h-4 w-6 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* View Profile Button Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <Skeleton className="h-10 w-full rounded-md" />
          </section>

          {/* Next Match Card Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="fifa-card p-4">
              <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
              </div>
            </div>
          </section>

          {/* Section Cards Skeleton */}
          {[1, 2].map((i) => (
            <section 
              key={i} 
              className="animate-fade-in" 
              style={{ animationDelay: `${0.15 + i * 0.05}s` }}
            >
              <div className="fifa-card p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default HomeSkeleton;
