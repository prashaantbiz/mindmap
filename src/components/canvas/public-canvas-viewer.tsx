"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MindMapNodeComponent, MindMapNodeData } from "./mind-map-node";
import { MindMapEdgeComponent } from "./mind-map-edge";
import { ExportDropdown } from "./export-dropdown";
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Eye,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface PublicCanvasViewerProps {
  project: {
    id: string;
    title: string;
    description?: string | null;
    folder?: string | null;
    tags?: string[];
  };
  accessLevel: string;
  initialNodes: any[];
  initialEdges: any[];
}

const nodeTypes = {
  mindMap: MindMapNodeComponent,
};

const edgeTypes = {
  mindMap: MindMapEdgeComponent,
};

function PublicCanvasInner({
  project,
  accessLevel,
  initialNodes,
  initialEdges,
}: PublicCanvasViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance<Node<MindMapNodeData>, Edge> | null>(null);

  const [lightboxMedia, setLightboxMedia] = React.useState<{ url: string; title?: string; type?: any } | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    const formattedNodes: Node<MindMapNodeData>[] = initialNodes.map((n: any) => {
      let extra: any = {};
      if (n.attachments) {
        try {
          extra = typeof n.attachments === "string" ? JSON.parse(n.attachments) : n.attachments;
        } catch {}
      }

      return {
        id: n.id,
        type: "mindMap",
        position: { x: n.positionX ?? 0, y: n.positionY ?? 0 },
        data: {
          text: n.text,
          description: n.description,
          icon: n.icon,
          color: n.color || "#6366f1",
          parentId: n.parentId,
          collapsed: n.collapsed,
          isRoot: n.isRoot,
          imageUrl: n.imageUrl || null,
          videoUrl: n.videoUrl || null,
          linkUrl: n.linkUrl || null,
          linkLabel: n.linkLabel || null,
          customWidth: extra.customWidth ?? n.customWidth ?? null,
          fontFamily: extra.fontFamily ?? n.fontFamily ?? null,
          fontSize: extra.fontSize ?? n.fontSize ?? null,
          fontStyle: extra.fontStyle ?? n.fontStyle ?? null,
          textAlign: extra.textAlign ?? n.textAlign ?? null,
        },
      };
    });

    const formattedEdges: Edge[] = initialEdges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "mindMap",
      data: { color: e.color || "#6366f1" },
      animated: e.animated,
    }));

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Collapse / Expand toggle in view mode
  const handleToggleCollapse = React.useCallback(
    (nodeId: string) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n
        )
      );
    },
    [setNodes]
  );

  const decoratedNodes = React.useMemo(() => {
    const childrenCountMap = new Map<string, number>();
    edges.forEach((e) => {
      childrenCountMap.set(e.source, (childrenCountMap.get(e.source) || 0) + 1);
    });

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        childCount: childrenCountMap.get(node.id) || 0,
        onToggleCollapse: handleToggleCollapse,
        onOpenMedia: (media: any) => {
          setLightboxMedia(media);
          setIsLightboxOpen(true);
        },
      },
    }));
  }, [nodes, edges, handleToggleCollapse]);

  const handleCopyShareUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setHasCopied(true);
      toast.success("Public link copied to clipboard!");
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Title and Read-only Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-1.5 px-3 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-lg shadow-black/5">
          <div className="relative h-6 w-6 rounded-full overflow-hidden ring-1 ring-primary/40 flex-shrink-0 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="mindmap.prashaant.biz" className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {project.title}
            </h1>
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 gap-1">
              <Eye className="h-2.5 w-2.5" />
              <span>Read Only</span>
            </Badge>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <ExportDropdown
            projectTitle={project.title}
            project={project}
            nodes={nodes}
            edges={edges}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyShareUrl}
            className="h-8.5 px-2.5 rounded-lg text-xs font-semibold gap-1.5 border-border/80 bg-card hover:bg-muted"
          >
            {hasCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setReactFlowInstance}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onlyRenderVisibleElements={true}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          color={isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.18)"}
        />

        <MiniMap
          position="bottom-left"
          className="!m-4 !rounded-xl !border !border-border/80 !bg-card/90 !backdrop-blur-xs !shadow-lg"
          nodeColor={(node: any) => node.data?.color || "#6366f1"}
          maskColor={isDark ? "rgba(14, 15, 18, 0.75)" : "rgba(251, 251, 250, 0.75)"}
          nodeStrokeWidth={3}
        />
      </ReactFlow>

      {/* Floating Canvas View Controls (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xl shadow-black/10">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => reactFlowInstance?.zoomIn({ duration: 200 })}
          className="h-7 w-7 rounded-lg"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => reactFlowInstance?.zoomOut({ duration: 200 })}
          className="h-7 w-7 rounded-lg"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => reactFlowInstance?.fitView({ duration: 300, padding: 0.2 })}
          className="h-7 w-7 rounded-lg"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bottom Center "Made with mindmap.prashaant.biz" Footer Banner */}
      <footer className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-border/80 bg-card/90 backdrop-blur-md shadow-xl shadow-black/10">
          <div className="relative h-6 w-6 rounded-full overflow-hidden ring-1 ring-primary/40 flex-shrink-0 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="mindmap.prashaant.biz" className="h-full w-full object-cover" />
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <strong className="text-foreground font-semibold">mindmap.prashaant.biz</strong>
          </span>
          <span className="h-3 w-px bg-border" />
          <Button
            asChild
            size="sm"
            className="h-6.5 px-3 text-[11px] font-semibold gap-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/signup">
              <span>Create Free Map</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

export function PublicCanvasViewer(props: PublicCanvasViewerProps) {
  return (
    <ReactFlowProvider>
      <PublicCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
