import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-[180px] mb-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-[120px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
