import { Skeleton } from '@/components/ui/skeleton';

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 glass px-4 py-3 safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Player Card Skeleton */}
          <section className="animate-fade-in">
            <div className="fifa-card p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-10 w-16" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section Skeleton */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="fifa-card p-4">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                    <Skeleton className="h-6 w-10 mx-auto" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Sections */}
          {[1, 2, 3].map((i) => (
            <section 
              key={i} 
              className="animate-fade-in" 
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div className="fifa-card p-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 mt-3" />
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
