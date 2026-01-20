import { Skeleton } from '@/components/ui/skeleton';

export const PeladaDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 glass px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-7 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>

        <main className="p-4 space-y-6">
          {/* Pelada Info Skeleton */}
          <section className="animate-fade-in">
            <div className="fifa-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          </section>

          {/* Próxima Partida Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="fifa-card p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
              </div>
              {/* Participants */}
              <div className="mt-4 pt-4 border-t border-border">
                <Skeleton className="h-4 w-28 mb-3" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Ranking Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="fifa-card p-4">
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 flex-1 rounded-md" />
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Jogos Anteriores Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="fifa-card p-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PeladaDetailsSkeleton;
