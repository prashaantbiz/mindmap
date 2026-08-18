"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Network, Lightbulb, Compass } from "lucide-react";

interface EmptyProjectsStateProps {
  onOpenCreate: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export function EmptyProjectsState({
  onOpenCreate,
  isFiltered = false,
  onClearFilters,
}: EmptyProjectsStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card/40 my-6">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <Compass className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No matching mind maps</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          We couldn&apos;t find any projects matching your search or active filters.
        </p>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card p-10 md:p-16 text-center shadow-sm">
      {/* Background ambient decorative circles */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        {/* Animated glowing central icon */}
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
            <Network className="h-8 w-8 animate-pulse" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground tracking-tight">
          Create your first mind map
        </h3>
        <p className="text-sm text-muted-foreground mt-2 mb-8 leading-relaxed">
          Brainstorm strategic ideas, diagram complex system architectures, or break down product roadmaps with connected visual nodes.
        </p>

        <Button
          size="lg"
          variant="glow"
          onClick={onOpenCreate}
          className="h-12 px-8 text-sm font-semibold rounded-xl gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Your First Mind Map
        </Button>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full pt-8 border-t border-border/60 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <span>5 Starter Templates</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Roadmaps, SWOT, System architecture, and meeting flows.
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Network className="h-3.5 w-3.5 text-primary" />
              <span>Real-Time Node Tree</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Infinite canvas with branches and dynamic connectors.
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Day & Night Themed</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deep charcoal dark mode with Electric Indigo glows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
