import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2 animate-in slide-in-from-top-4 duration-700">
        <Skeleton className="h-8 w-[250px] rounded-lg shimmer" />
        <Skeleton className="h-4 w-[350px] rounded-lg shimmer" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm animate-in fade-in-up duration-700"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Skeleton className="h-4 w-[100px] mb-3 rounded-lg shimmer" />
            <Skeleton className="h-8 w-[150px] mb-2 rounded-lg shimmer" />
            <Skeleton className="h-3 w-[120px] rounded-lg shimmer" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm animate-in fade-in-up duration-700 delay-500">
          <Skeleton className="h-6 w-[180px] mb-4 rounded-lg shimmer" />
          <Skeleton className="h-[250px] w-full rounded-lg shimmer" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm animate-in fade-in-up duration-700 delay-600">
          <Skeleton className="h-6 w-[160px] mb-4 rounded-lg shimmer" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg shimmer" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Videos */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm animate-in fade-in-up duration-700 delay-700">
        <Skeleton className="h-6 w-[200px] mb-4 rounded-lg shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[180px] w-full rounded-lg shimmer" />
              <Skeleton className="h-4 w-full rounded-lg shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
