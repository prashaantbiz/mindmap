import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in-50">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted/60 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-muted/80 animate-pulse" />
          <div className="h-3 w-64 rounded-md bg-muted/40 animate-pulse" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-56 w-full rounded-2xl bg-card border border-border/80 p-6 space-y-4">
          <div className="h-5 w-36 rounded bg-muted/80 animate-pulse" />
          <div className="h-16 w-16 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-muted/40 animate-pulse" />
        </div>

        <div className="h-48 w-full rounded-2xl bg-card border border-border/80 p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-muted/80 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
