import { Skeleton } from "@/components/ui/skeleton"

export default function VideosLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2 animate-in slide-in-from-top-4 duration-700">
        <Skeleton className="h-8 w-[200px] rounded-lg shimmer" />
        <Skeleton className="h-4 w-[300px] rounded-lg shimmer" />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4 gap-4 animate-in slide-in-from-top-4 duration-700 delay-100">
        <Skeleton className="h-10 w-[150px] rounded-lg shimmer" />
        <Skeleton className="h-10 w-[120px] rounded-lg shimmer" />
      </div>

      {/* Video Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all animate-in fade-in-up duration-700"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-muted h-40">
                <Skeleton className="h-full w-full shimmer" />
                <div className="absolute top-2 right-2">
                  <Skeleton className="h-6 w-12 rounded-full shimmer" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-full rounded-lg shimmer" />
                <Skeleton className="h-4 w-3/4 rounded-lg shimmer" />

                {/* Stats */}
                <div className="flex justify-between pt-2 gap-2">
                  <Skeleton className="h-4 w-[80px] rounded-lg shimmer" />
                  <Skeleton className="h-4 w-[60px] rounded-lg shimmer" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3 w-16 rounded-full shimmer" />
                  <Skeleton className="h-3 w-20 rounded-full shimmer" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
