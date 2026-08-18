import { Loader2, Sparkles } from "lucide-react";

export default function CanvasLoading() {
  return (
    <div className="w-screen h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Top Header Placeholder */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-border/70 bg-background/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-lg bg-muted/60 animate-pulse" />
          <div className="h-4 w-px bg-border" />
          <div className="h-5 w-40 rounded-md bg-muted/70 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-lg bg-muted/50 animate-pulse" />
          <div className="h-8 w-16 rounded-lg bg-primary/20 animate-pulse" />
        </div>
      </div>

      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Central Loading Shimmer */}
      <div className="z-10 flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/90 border border-border/80 shadow-2xl backdrop-blur-md">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-foreground">Loading Canvas Workspace</h3>
          <p className="text-xs text-muted-foreground">Rendering nodes, curved connectors, and attachments...</p>
        </div>
      </div>
    </div>
  );
}
