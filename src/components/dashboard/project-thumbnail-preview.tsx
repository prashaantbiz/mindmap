"use client";

import * as React from "react";

interface ProjectThumbnailPreviewProps {
  title: string;
  nodeCount: number;
  folder?: string | null;
}

export function ProjectThumbnailPreview({
  title,
  nodeCount,
  folder,
}: ProjectThumbnailPreviewProps) {
  // Deterministic color variation based on project title
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    { primary: "#6366F1", secondary: "#818CF8", bgNode: "rgba(99, 102, 241, 0.15)" },
    { primary: "#8B5CF6", secondary: "#A78BFA", bgNode: "rgba(139, 92, 246, 0.15)" },
    { primary: "#EC4899", secondary: "#F472B6", bgNode: "rgba(236, 72, 153, 0.15)" },
    { primary: "#10B981", secondary: "#34D399", bgNode: "rgba(16, 185, 129, 0.15)" },
    { primary: "#06B6D4", secondary: "#22D3EE", bgNode: "rgba(6, 182, 212, 0.15)" },
  ];
  const activePalette = palettes[hash % palettes.length];

  return (
    <div className="relative w-full h-36 rounded-t-xl bg-gradient-to-b from-muted/50 to-muted/20 overflow-hidden flex items-center justify-center p-3 border-b border-border/50 group-hover:from-muted/70 transition-colors">
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:14px_14px]" />

      <svg
        viewBox="0 0 280 140"
        className="w-full h-full max-w-[260px] relative z-10 transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curved Connector Lines */}
        <path
          d="M 140 70 C 100 70, 90 35, 55 35"
          stroke={activePalette.primary}
          strokeWidth="2"
          strokeDasharray="2 2"
          className="opacity-70"
        />
        <path
          d="M 140 70 C 100 70, 90 105, 55 105"
          stroke={activePalette.primary}
          strokeWidth="2"
          className="opacity-60"
        />
        <path
          d="M 140 70 C 180 70, 190 35, 225 35"
          stroke={activePalette.primary}
          strokeWidth="2"
          className="opacity-60"
        />
        <path
          d="M 140 70 C 180 70, 190 105, 225 105"
          stroke={activePalette.primary}
          strokeWidth="2"
          strokeDasharray="2 2"
          className="opacity-70"
        />

        {/* Outer Child Nodes */}
        {/* Top Left */}
        <g transform="translate(55, 35)">
          <circle r="12" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1.5" />
          <circle r="4" fill={activePalette.primary} />
        </g>

        {/* Bottom Left */}
        <g transform="translate(55, 105)">
          <circle r="14" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1.5" />
          <circle r="5" fill={activePalette.primary} />
        </g>

        {/* Top Right */}
        <g transform="translate(225, 35)">
          <circle r="13" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1.5" />
          <circle r="4.5" fill={activePalette.primary} />
        </g>

        {/* Bottom Right */}
        <g transform="translate(225, 105)">
          <circle r="12" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1.5" />
          <circle r="4" fill={activePalette.primary} />
        </g>

        {/* Additional Sub-nodes if nodeCount > 5 */}
        {nodeCount > 5 && (
          <>
            <path d="M 55 35 L 25 22" stroke={activePalette.secondary} strokeWidth="1.5" strokeOpacity="0.5" />
            <circle cx="25" cy="22" r="6" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1" />
            
            <path d="M 225 105 L 255 118" stroke={activePalette.secondary} strokeWidth="1.5" strokeOpacity="0.5" />
            <circle cx="255" cy="118" r="6" fill={activePalette.bgNode} stroke={activePalette.secondary} strokeWidth="1" />
          </>
        )}

        {/* Central Core Node (with Glow) */}
        <g transform="translate(140, 70)">
          <circle r="24" fill={activePalette.primary} fillOpacity="0.15" />
          <rect
            x="-30"
            y="-14"
            width="60"
            height="28"
            rx="8"
            fill="hsl(var(--card))"
            stroke={activePalette.primary}
            strokeWidth="2"
            className="shadow-sm"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="10"
            fontWeight="bold"
            className="select-none tracking-tight"
          >
            {title.length > 8 ? `${title.substring(0, 7)}…` : title}
          </text>
        </g>
      </svg>

      {/* Floating Node Count Badge */}
      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-xs border border-border/80 text-[10px] font-medium text-foreground/80 flex items-center gap-1 shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
      </div>

      {folder && (
        <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-xs border border-border/60 text-[10px] text-muted-foreground font-medium">
          {folder}
        </div>
      )}
    </div>
  );
}
