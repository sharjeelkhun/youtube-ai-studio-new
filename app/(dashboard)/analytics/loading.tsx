import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[350px] w-full rounded-lg" />
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
