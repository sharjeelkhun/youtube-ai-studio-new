import { Skeleton } from "@/components/ui/skeleton"

export default function SuggestionsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[220px]" />
        <Skeleton className="h-4 w-[340px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg border p-4 shadow-sm">
              <Skeleton className="h-6 w-[180px] mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-end mt-4">
                <Skeleton className="h-9 w-[100px]" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
