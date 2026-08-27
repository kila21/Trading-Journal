import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="ml-auto h-5 w-14 rounded-full" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-24" />
          </Card>
        ))}
      </div>

      <Skeleton className="h-9 w-48 rounded-full" />

      <Card>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="min-h-16 sm:min-h-24" />
          ))}
        </div>
      </Card>
    </div>
  );
}
