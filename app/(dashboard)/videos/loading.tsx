import { Skeleton } from "@/components/ui/skeleton"

export default function VideosLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border shadow-sm overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
