import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/80 animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-primary/20 animate-pulse" />
      </div>

      {/* Filter toolbar skeleton */}
      <div className="h-10 w-full rounded-xl bg-muted/40 animate-pulse" />

      {/* Grid skeleton */}
      <DashboardSkeleton count={8} />
    </div>
  );
}
