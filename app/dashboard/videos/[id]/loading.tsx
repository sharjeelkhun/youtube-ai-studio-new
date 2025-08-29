import { Skeleton } from "@/components/ui/skeleton"

export default function VideoDetailLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-[100px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <Skeleton className="h-[300px] w-full mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />

          <div className="space-y-4">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-[120px] mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-[120px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-[110px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-[140px] mb-4" />
            <Skeleton className="h-[150px] w-full" />
          </div>

          <div className="rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-[160px] mb-4" />
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
