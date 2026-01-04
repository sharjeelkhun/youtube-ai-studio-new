import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
    </div>
  )
}
