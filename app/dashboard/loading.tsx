import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[100px] mb-2" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[120px] mb-2" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[110px] mb-2" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[90px] mb-2" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[180px] mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-[160px] mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 shadow-sm">
        <Skeleton className="h-6 w-[200px] mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
        </div>
      </div>
    </div>
  )
}
