import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <Skeleton className="h-4 w-[300px] rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-[120px] rounded-lg mb-3" />
            <Skeleton className="h-8 w-full rounded-lg mb-2" />
            <Skeleton className="h-3 w-[100px] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-6 w-[150px] rounded-lg mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-6 w-[150px] rounded-lg mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      {/* Large Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-6 w-[180px] rounded-lg mb-4" />
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>
    </div>
  )
}
