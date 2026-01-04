import { Skeleton } from "@/components/ui/skeleton"

export default function VideoDetailLoading() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Skeleton - Hidden on mobile */}
      <div className="hidden w-64 border-r border-gray-200 bg-white md:flex flex-col">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
            <Skeleton className="h-5 w-[200px] rounded-lg" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="bg-muted/40 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-[100px] rounded-lg" />
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            {/* Main Content */}
            <div className="space-y-4">
              {/* Thumbnail */}
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100 h-[300px]">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>

              {/* Title & Date */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>

              {/* Description */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <Skeleton className="h-6 w-[150px] rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </div>

              {/* Edit Form Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                <Skeleton className="h-6 w-[120px] rounded-lg" />
                <div className="space-y-3">
                  <div>
                    <Skeleton className="h-4 w-[80px] mb-2 rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-[120px] mb-2 rounded-lg" />
                    <Skeleton className="h-[120px] w-full rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-6 w-[120px] mb-4 rounded-lg" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-[100px] rounded-lg" />
                      <Skeleton className="h-5 w-[80px] rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-6 w-[140px] mb-4 rounded-lg" />
                <Skeleton className="h-[150px] w-full rounded-lg" />
              </div>

              {/* Comments Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-6 w-[160px] mb-4 rounded-lg" />
                <div className="space-y-3">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[120px] rounded-lg" />
                          <Skeleton className="h-3 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Features Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            {/* Health Summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-6 w-[180px] mb-4 rounded-lg" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>

            {/* AI Checklist */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-6 w-[160px] mb-4 rounded-lg" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
