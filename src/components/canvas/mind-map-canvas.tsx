"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { MindMapNodeComponent, MindMapNodeData } from "./mind-map-node";
import { MindMapEdgeComponent } from "./mind-map-edge";
import { FloatingToolbar } from "./floating-toolbar";
import { NodeInspectorPanel } from "./node-inspector-panel";
import { EditorTopNav } from "./editor-top-nav";
import { ShareModal } from "./share-modal";
import { CanvasHistoryManager } from "@/lib/canvas-history";
import { applyAutoLayout, LayoutMode } from "@/lib/auto-layout";
import { getFontClass } from "@/lib/fonts";
import { Sparkles } from "lucide-react";

const nodeTypes: NodeTypes = {
  mindMap: MindMapNodeComponent,
};

const edgeTypes: EdgeTypes = {
  mindMap: MindMapEdgeComponent,
};

interface MindMapCanvasProps {
  projectId: string;
}

export function MindMapCanvas({ projectId }: MindMapCanvasProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Canvas graph state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance<Node<MindMapNodeData>, Edge> | null>(null);

  // Metadata & Canvas UI State
  const [project, setProject] = React.useState<{ id: string; title: string; folder?: string | null } | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = React.useState<string | null>(null);
  const [canvasFont, setCanvasFont] = React.useState<string>("inter");

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // History Manager
  const historyRef = React.useRef(new CanvasHistoryManager<Node<MindMapNodeData>, Edge>());
  const [historyCounts, setHistoryCounts] = React.useState({ undoCount: 0, redoCount: 0 });
  const isUndoRedoAction = React.useRef(false);

  // Debounced Autosave Timer
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = React.useRef(true);

  // Update history state tracker
  const recordHistory = React.useCallback(
    (newNodes: Node<MindMapNodeData>[], newEdges: Edge[]) => {
      if (isUndoRedoAction.current) return;
      historyRef.current.push(newNodes, newEdges);
      setHistoryCounts(historyRef.current.getCounts());
    },
    []
  );

  // 1. Initial Load from Database
  React.useEffect(() => {
    async function loadCanvas() {
      try {
        const res = await fetch(`/api/projects/${projectId}/nodes`);
        if (!res.ok) throw new Error("Failed to load project canvas");
        const data = await res.json();

        setProject(data.project);

        // Map DB nodes to React Flow format with rich attachments & sizing
        const initialNodes: Node<MindMapNodeData>[] = (data.nodes || []).map((n: any) => {
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
              attachments: n.attachments || null,
            },
          };
        });

        const initialEdges: Edge[] = (data.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "mindMap",
          data: { color: e.color || "#6366f1" },
          animated: e.animated,
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);

        historyRef.current.clear();
        isInitialLoad.current = false;
        setSaveStatus("saved");
      } catch (err) {
        console.error("Error loading canvas:", err);
        toast.error("Failed to load canvas data");
      }
    }
    loadCanvas();
  }, [projectId, setNodes, setEdges]);

  // 2. Debounced Autosave to Database
  const triggerAutosave = React.useCallback(
    (currentNodes: Node<MindMapNodeData>[], currentEdges: Edge[]) => {
      if (isInitialLoad.current) return;

      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payloadNodes = currentNodes.map((n) => {
            const attachmentsPayload = JSON.stringify({
              customWidth: n.data.customWidth || null,
              fontFamily: n.data.fontFamily || null,
              fontSize: n.data.fontSize || null,
              fontStyle: n.data.fontStyle || null,
              textAlign: n.data.textAlign || null,
            });

            return {
              id: n.id,
              parentId: n.data.parentId || null,
              text: n.data.text || "Untitled",
              description: n.data.description || null,
              icon: n.data.icon || null,
              color: n.data.color || "#6366f1",
              positionX: n.position.x,
              positionY: n.position.y,
              collapsed: Boolean(n.data.collapsed),
              isRoot: Boolean(n.data.isRoot),
              imageUrl: n.data.imageUrl || null,
              videoUrl: n.data.videoUrl || null,
              linkUrl: n.data.linkUrl || null,
              linkLabel: n.data.linkLabel || null,
              attachments: attachmentsPayload,
            };
          });

          const payloadEdges = currentEdges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            color: (e.data as any)?.color || "#6366f1",
            animated: Boolean(e.animated),
          }));

          const res = await fetch(`/api/projects/${projectId}/nodes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: payloadNodes, edges: payloadEdges }),
          });

          if (res.ok) {
            setSaveStatus("saved");
            setLastSavedAt(new Date());
          }
        } catch (err) {
          console.error("Autosave error:", err);
          setSaveStatus("unsaved");
        }
      }, 800);
    },
    [projectId]
  );

  // 3. Update Node Box Width via Right Edge Dot Dragging
  const handleUpdateNodeWidth = React.useCallback(
    (nodeId: string, width: number) => {
      const nextNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                customWidth: width,
              },
            }
          : n
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      triggerAutosave(nextNodes, edges);
    },
    [nodes, edges, recordHistory, setNodes, triggerAutosave]
  );

  // 4. Update Mind Map Global Font
  const handleUpdateCanvasFont = React.useCallback(
    (fontId: string) => {
      setCanvasFont(fontId);
      triggerAutosave(nodes, edges);
      toast.success(`Font changed to ${fontId.charAt(0).toUpperCase() + fontId.slice(1)}`);
    },
    [nodes, edges, triggerAutosave]
  );

  // 5. Node CRUD & Tree Operations
  const handleAddChild = React.useCallback(
    (parentId?: string, direction: "right" | "left" = "right") => {
      const parent = parentId ? nodes.find((n) => n.id === parentId) : nodes.find((n) => n.selected) || nodes[0];
      if (!parent) return;

      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const branchColor = parent.data.color || "#6366f1";
      const siblingCount = edges.filter((e) => e.source === parent.id).length;

      const xOffset = direction === "right" ? 280 : -280;
      const yOffset = siblingCount === 0 ? 0 : (siblingCount % 2 === 1 ? 1 : -1) * Math.ceil(siblingCount / 2) * 90;

      const newNode: Node<MindMapNodeData> = {
        id: newId,
        type: "mindMap",
        position: {
          x: parent.position.x + xOffset,
          y: parent.position.y + yOffset,
        },
        data: {
          text: "New Sub-topic",
          description: "",
          icon: "💡",
          color: branchColor,
          parentId: parent.id,
          collapsed: false,
          isRoot: false,
        },
      };

      const newEdge: Edge = {
        id: `edge_${parent.id}_${newId}`,
        source: parent.id,
        target: newId,
        type: "mindMap",
        data: { color: branchColor },
        animated: true,
      };

      const nextNodes = [...nodes, newNode];
      const nextEdges = [...edges, newEdge];

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(newId);
      triggerAutosave(nextNodes, nextEdges);
    },
    [nodes, edges, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  const handleAddSibling = React.useCallback(() => {
    const selected = nodes.find((n) => n.id === selectedNodeId || n.selected);
    if (!selected || selected.data.isRoot || !selected.data.parentId) {
      handleAddChild(selected?.id || nodes[0]?.id);
      return;
    }
    handleAddChild(selected.data.parentId);
  }, [nodes, selectedNodeId, handleAddChild]);

  const handleDeleteSelected = React.useCallback(
    (targetId?: string) => {
      const selectedIds = targetId
        ? [targetId]
        : nodes.filter((n) => n.selected).map((n) => n.id);

      if (selectedIds.length === 0 && selectedNodeId) {
        selectedIds.push(selectedNodeId);
      }

      if (selectedIds.length === 0) return;

      const filteredSelected = selectedIds.filter((id) => {
        const node = nodes.find((n) => n.id === id);
        return node && !node.data.isRoot;
      });

      if (filteredSelected.length === 0) {
        toast.info("Root idea cannot be deleted");
        return;
      }

      const toDelete = new Set<string>(filteredSelected);
      let changed = true;
      while (changed) {
        changed = false;
        edges.forEach((e) => {
          if (toDelete.has(e.source) && !toDelete.has(e.target)) {
            toDelete.add(e.target);
            changed = true;
          }
        });
      }

      const nextNodes = nodes.filter((n) => !toDelete.has(n.id));
      const nextEdges = edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(null);
      triggerAutosave(nextNodes, nextEdges);
      toast.success(`Removed ${toDelete.size} ${toDelete.size === 1 ? "node" : "nodes"}`);
    },
    [nodes, edges, selectedNodeId, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  const handleToggleCollapse = React.useCallback(
    (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (!target) return;

      const newCollapsed = !target.data.collapsed;
      const nextNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, collapsed: newCollapsed } } : n
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      triggerAutosave(nextNodes, edges);
    },
    [nodes, edges, recordHistory, setNodes, triggerAutosave]
  );

  const handleUpdateNodeText = React.useCallback(
    (nodeId: string, text: string, description?: string) => {
      const nextNodes = nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, text, description: description ?? n.data.description } }
          : n
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      triggerAutosave(nextNodes, edges);
    },
    [nodes, edges, recordHistory, setNodes, triggerAutosave]
  );

  const handleRecolor = React.useCallback(
    (nodeIdOrColor: string, newColor?: string) => {
      const color = newColor || nodeIdOrColor;
      const targetIds = newColor
        ? [nodeIdOrColor]
        : nodes.filter((n) => n.selected).map((n) => n.id);

      if (targetIds.length === 0 && selectedNodeId) {
        targetIds.push(selectedNodeId);
      }

      if (targetIds.length === 0) return;

      const targetSet = new Set(targetIds);

      let changed = true;
      while (changed) {
        changed = false;
        edges.forEach((e) => {
          if (targetSet.has(e.source) && !targetSet.has(e.target)) {
            targetSet.add(e.target);
            changed = true;
          }
        });
      }

      const nextNodes = nodes.map((n) =>
        targetSet.has(n.id) ? { ...n, data: { ...n.data, color } } : n
      );

      const nextEdges = edges.map((e) =>
        targetSet.has(e.source) || targetSet.has(e.target)
          ? { ...e, data: { ...e.data, color } }
          : e
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      triggerAutosave(nextNodes, nextEdges);
    },
    [nodes, edges, selectedNodeId, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // 6. Drag-and-Drop Reparenting
  const onNodeDrag = React.useCallback(
    (_: any, node: Node) => {
      const overlapNode = nodes.find(
        (n) =>
          n.id !== node.id &&
          Math.abs(n.position.x - node.position.x) < 80 &&
          Math.abs(n.position.y - node.position.y) < 50
      );
      setDragOverNodeId(overlapNode ? overlapNode.id : null);
    },
    [nodes]
  );

  const onNodeDragStop = React.useCallback(
    (_: any, node: Node) => {
      if (dragOverNodeId && dragOverNodeId !== node.id) {
        const newParent = nodes.find((n) => n.id === dragOverNodeId);
        if (newParent && !node.data.isRoot) {
          const nextNodes = nodes.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    parentId: newParent.id,
                    color: newParent.data.color || n.data.color,
                  },
                }
              : n
          );

          const filteredEdges = edges.filter((e) => e.target !== node.id);
          const newEdge: Edge = {
            id: `edge_${newParent.id}_${node.id}`,
            source: newParent.id,
            target: node.id,
            type: "mindMap",
            data: { color: newParent.data.color || "#6366f1" },
            animated: true,
          };

          const nextEdges = [...filteredEdges, newEdge];

          recordHistory(nodes, edges);
          setNodes(nextNodes);
          setEdges(nextEdges);
          triggerAutosave(nextNodes, nextEdges);
          toast.success(`Reparented under "${newParent.data.text}"`);
        }
      } else {
        triggerAutosave(nodes, edges);
      }
      setDragOverNodeId(null);
    },
    [dragOverNodeId, nodes, edges, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // 7. Undo / Redo
  const handleUndo = React.useCallback(() => {
    isUndoRedoAction.current = true;
    const previous = historyRef.current.undo(nodes, edges);
    if (previous) {
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setHistoryCounts(historyRef.current.getCounts());
      triggerAutosave(previous.nodes, previous.edges);
    }
    isUndoRedoAction.current = false;
  }, [nodes, edges, setNodes, setEdges, triggerAutosave]);

  const handleRedo = React.useCallback(() => {
    isUndoRedoAction.current = true;
    const next = historyRef.current.redo(nodes, edges);
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryCounts(historyRef.current.getCounts());
      triggerAutosave(next.nodes, next.edges);
    }
    isUndoRedoAction.current = false;
  }, [nodes, edges, setNodes, setEdges, triggerAutosave]);

  // 8. Auto-Layout
  const handleAutoLayout = React.useCallback(
    (mode: LayoutMode) => {
      const layouted = applyAutoLayout(nodes, edges, mode);
      recordHistory(nodes, edges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      triggerAutosave(layouted.nodes, layouted.edges);

      setTimeout(() => {
        reactFlowInstance?.fitView({ duration: 300, padding: 0.2 });
      }, 50);

      toast.success(
        mode === "radial" ? "Tidied into Radial Mind Map" : "Tidied into Top-Down Tree"
      );
    },
    [nodes, edges, reactFlowInstance, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // 9. Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        handleAddChild();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleAddSibling();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAddChild, handleAddSibling, handleDeleteSelected, handleUndo, handleRedo]);

  // Helper to update child counts and callbacks on nodes
  const decoratedNodes = React.useMemo(() => {
    const childrenCountMap = new Map<string, number>();
    edges.forEach((e) => {
      childrenCountMap.set(e.source, (childrenCountMap.get(e.source) || 0) + 1);
    });

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        canvasFont,
        childCount: childrenCountMap.get(node.id) || 0,
        isDropTarget: node.id === dragOverNodeId,
        onAddChild: (parentId: string, direction?: "right" | "left") => handleAddChild(parentId, direction),
        onToggleCollapse: (nodeId: string) => handleToggleCollapse(nodeId),
        onUpdateText: (nodeId: string, text: string, desc?: string) => handleUpdateNodeText(nodeId, text, desc),
        onUpdateNodeWidth: handleUpdateNodeWidth,
      },
    }));
  }, [nodes, edges, dragOverNodeId, canvasFont, handleAddChild, handleToggleCollapse, handleUpdateNodeText, handleUpdateNodeWidth]);

  const selectedNode = React.useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId || n.selected) || null;
  }, [nodes, selectedNodeId]);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-background ${getFontClass(canvasFont)}`}>
      {/* Editor Top Navigation */}
      <EditorTopNav
        project={project}
        nodeCount={nodes.length}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        onUpdateTitle={(title) => {
          setProject((prev) => (prev ? { ...prev, title } : null));
          fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          });
        }}
        onOpenShare={() => setIsShareModalOpen(true)}
        nodes={nodes}
        edges={edges}
        currentFont={canvasFont}
        onUpdateFont={handleUpdateCanvasFont}
      />

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        onInit={setReactFlowInstance}
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        onlyRenderVisibleElements={true}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        className="touch-none"
      >
        {/* Subtle Theme-aware Dot Grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          color={isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.18)"}
        />

        {/* Minimap in bottom-right corner */}
        {showMinimap && (
          <MiniMap
            nodeColor={(n) => ((n.data as any)?.color as string) || "#6366f1"}
            nodeStrokeWidth={3}
            maskColor={isDark ? "rgba(14, 15, 18, 0.75)" : "rgba(251, 251, 250, 0.75)"}
            className="!rounded-xl !border !border-border/80 !shadow-xl !overflow-hidden !bg-card/90 backdrop-blur-xs !bottom-6 !right-6 hidden sm:block"
            zoomable
            pannable
          />
        )}
      </ReactFlow>

      {/* Onboarding / Empty State Hint Pill */}
      {nodes.length <= 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/95 border border-primary/40 shadow-lg text-xs font-medium text-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Click any node and press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Tab</kbd> to add subtopics</span>
          </div>
        </div>
      )}

      {/* Floating Toolbar with Canva-style tools & Font selector */}
      <FloatingToolbar
        onAddChild={() => handleAddChild()}
        onAddSibling={handleAddSibling}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyCounts.undoCount > 0}
        canRedo={historyCounts.redoCount > 0}
        onZoomIn={() => reactFlowInstance?.zoomIn({ duration: 200 })}
        onZoomOut={() => reactFlowInstance?.zoomOut({ duration: 200 })}
        onFitView={() => reactFlowInstance?.fitView({ duration: 250, padding: 0.25 })}
        onResetView={() => reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 250 })}
        onAutoLayout={handleAutoLayout}
        onRecolorSelected={(color) => handleRecolor(color)}
        hasSelection={Boolean(selectedNodeId || nodes.some((n) => n.selected))}
        selectedCount={nodes.filter((n) => n.selected).length || (selectedNodeId ? 1 : 0)}
        currentFont={canvasFont}
        onUpdateFont={handleUpdateCanvasFont}
      />

      {/* Node Inspector Panel */}
      {selectedNode && (
        <NodeInspectorPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={(id, updates) => {
            const nextNodes = nodes.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, ...updates } } : n
            );
            recordHistory(nodes, edges);
            setNodes(nextNodes);
            triggerAutosave(nextNodes, edges);
          }}
          onDelete={(id) => handleDeleteSelected(id)}
          onAddChild={(id) => handleAddChild(id)}
        />
      )}

      {/* Share & Permissions Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projectId}
        projectTitle={project?.title || "Mind Map"}
      />
    </div>
  );
}
