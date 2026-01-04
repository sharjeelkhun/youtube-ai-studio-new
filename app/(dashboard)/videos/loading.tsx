import { Skeleton } from "@/components/ui/skeleton"

export default function VideosLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <Skeleton className="h-4 w-[300px] rounded-lg" />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <Skeleton className="h-10 w-[150px] rounded-lg" />
        <Skeleton className="h-10 w-[120px] rounded-lg" />
      </div>

      {/* Video Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-gray-100 h-40">
                <Skeleton className="h-full w-full" />
                <div className="absolute top-2 right-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />

                {/* Stats */}
                <div className="flex justify-between pt-2 gap-2">
                  <Skeleton className="h-4 w-[80px] rounded-lg" />
                  <Skeleton className="h-4 w-[60px] rounded-lg" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
