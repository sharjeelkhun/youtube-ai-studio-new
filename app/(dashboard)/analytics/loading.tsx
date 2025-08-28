import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[120px] mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[140px] mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[100px] mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      <div className="rounded-lg border p-4 shadow-sm">
        <Skeleton className="h-6 w-[180px] mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[130px] mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  )
}
