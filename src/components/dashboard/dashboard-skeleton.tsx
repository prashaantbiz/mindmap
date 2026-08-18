import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in-50 duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/70 bg-card p-4 space-y-3.5 shadow-sm"
        >
          {/* Shimmering Thumbnail */}
          <div className="w-full h-36 rounded-xl bg-muted/60 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>

          {/* Shimmering Title and Tags */}
          <div className="space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded-md bg-muted/80 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded-md bg-muted/60 animate-pulse" />
              <div className="h-3 w-12 rounded-md bg-muted/40 animate-pulse" />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <div className="h-3 w-20 rounded-md bg-muted/50 animate-pulse" />
            <div className="h-4 w-4 rounded-full bg-muted/60 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
