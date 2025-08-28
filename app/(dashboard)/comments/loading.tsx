import { Skeleton } from "@/components/ui/skeleton"

export default function CommentsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[320px]" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-8 w-[80px]" />
                    <Skeleton className="h-8 w-[80px]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  )
}
