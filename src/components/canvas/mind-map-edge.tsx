"use client";

import * as React from "react";
import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";

export function MindMapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35,
  });

  const branchColor = (data as any)?.color || style?.stroke || "#6366f1";

  return (
    <>
      {/* Outer subtle glow line */}
      <path
        d={edgePath}
        fill="none"
        stroke={branchColor}
        strokeWidth={6}
        strokeOpacity={0.15}
        className="pointer-events-none"
      />

      {/* Main crisp bezier connector curve */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: branchColor,
          strokeWidth: 2,
          strokeLinecap: "round",
          transition: "stroke 150ms, stroke-width 150ms",
        }}
      />
    </>
  );
}
