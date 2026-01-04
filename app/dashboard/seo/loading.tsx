import { Skeleton } from "@/components/ui/skeleton"

export default function SeoLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-4 w-[320px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-6 w-[160px] mb-4 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-6 w-[140px] mb-4 rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-6 w-[200px] mb-4 rounded-lg" />
        <div className="space-y-4">
          <div className="space-y-2 pb-4 border-b border-gray-100">
            <Skeleton className="h-5 w-[250px] rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-[220px] rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
