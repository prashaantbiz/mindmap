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
  NodeChange,
  applyNodeChanges,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CanvasHistoryManager } from "@/lib/canvas-history";
import { applyAutoLayout, LayoutMode } from "@/lib/auto-layout";
import { getFontClass } from "@/lib/fonts";
import {
  Plus,
  GitBranch,
  Copy,
  Trash2,
  FoldHorizontal,
  UnfoldHorizontal,
  AlertTriangle,
} from "lucide-react";

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
  const [nodes, setNodes] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance<Node<MindMapNodeData>, Edge> | null>(null);

  // Metadata & Canvas UI State
  const [project, setProject] = React.useState<{
    id: string;
    title: string;
    folder?: string | null;
  } | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = React.useState<string | null>(null);
  const [canvasFont, setCanvasFont] = React.useState<string>("inter");

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = React.useState<{
    isOpen: boolean;
    nodeId: string | null;
    nodeTitle: string;
    descendantCount: number;
  }>({
    isOpen: false,
    nodeId: null,
    nodeTitle: "",
    descendantCount: 0,
  });

  // Right-Click Context Menu State
  const [contextMenuState, setContextMenuState] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // History Manager
  const historyRef = React.useRef(new CanvasHistoryManager<Node<MindMapNodeData>, Edge>());
  const [historyCounts, setHistoryCounts] = React.useState({ undoCount: 0, redoCount: 0 });
  const isUndoRedoAction = React.useRef(false);

  // Pending Save Tracker & Debounced Autosave Timer
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = React.useRef(true);
  const pendingSaveRef = React.useRef<{
    nodes: Node<MindMapNodeData>[];
    edges: Edge[];
  } | null>(null);
  const currentNodesRef = React.useRef(nodes);
  const currentEdgesRef = React.useRef(edges);

  React.useEffect(() => {
    currentNodesRef.current = nodes;
    currentEdgesRef.current = edges;
  }, [nodes, edges]);

  // Update history state tracker
  const recordHistory = React.useCallback(
    (newNodes: Node<MindMapNodeData>[], newEdges: Edge[]) => {
      if (isUndoRedoAction.current) return;
      historyRef.current.push(newNodes, newEdges);
      setHistoryCounts(historyRef.current.getCounts());
    },
    []
  );

  // Helper: Build API & Local Storage Payload
  const prepareSavePayload = React.useCallback(
    (currentNodes: Node<MindMapNodeData>[], currentEdges: Edge[]) => {
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
          color: n.data.color || "#0084ff",
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
        color: (e.data as any)?.color || "#0084ff",
        animated: Boolean(e.animated),
      }));

      return { nodes: payloadNodes, edges: payloadEdges };
    },
    []
  );

  // Direct Execution of Canvas Save
  const executeSave = React.useCallback(
    async (currentNodes: Node<MindMapNodeData>[], currentEdges: Edge[]) => {
      if (isInitialLoad.current) return;

      const { nodes: payloadNodes, edges: payloadEdges } = prepareSavePayload(
        currentNodes,
        currentEdges
      );

      // Instant local backup
      try {
        localStorage.setItem(
          `mindmap_backup_${projectId}`,
          JSON.stringify({
            nodes: payloadNodes,
            edges: payloadEdges,
            timestamp: Date.now(),
          })
        );
      } catch {}

      try {
        const res = await fetch(`/api/projects/${projectId}/nodes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: payloadNodes, edges: payloadEdges }),
          keepalive: true,
        });

        if (res.ok) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          pendingSaveRef.current = null;
        } else {
          setSaveStatus("unsaved");
        }
      } catch (err) {
        console.error("Autosave HTTP error:", err);
        setSaveStatus("unsaved");
      }
    },
    [projectId, prepareSavePayload]
  );

  // 1. Initial Load from Database with LocalStorage Fallback
  React.useEffect(() => {
    async function loadCanvas() {
      try {
        const res = await fetch(`/api/projects/${projectId}/nodes`);
        if (!res.ok) throw new Error("Failed to load project canvas");
        const data = await res.json();

        setProject(data.project);

        let serverNodes = data.nodes || [];
        let serverEdges = data.edges || [];

        // Check if browser has a valid, newer local backup
        try {
          const rawBackup = localStorage.getItem(`mindmap_backup_${projectId}`);
          if (rawBackup) {
            const backup = JSON.parse(rawBackup);
            if (backup.nodes && Array.isArray(backup.nodes) && backup.nodes.length > 0) {
              const serverUpdatedAt = data.project?.updatedAt
                ? new Date(data.project.updatedAt).getTime()
                : 0;
              if (
                serverNodes.length === 0 ||
                (backup.timestamp && serverUpdatedAt > 0 && backup.timestamp > serverUpdatedAt + 2000)
              ) {
                serverNodes = backup.nodes;
                serverEdges = backup.edges || [];
              }
            }
          }
        } catch {}

        const initialNodes: Node<MindMapNodeData>[] = serverNodes.map((n: any) => {
          let extra: any = {};
          if (n.attachments) {
            try {
              extra =
                typeof n.attachments === "string" ? JSON.parse(n.attachments) : n.attachments;
            } catch {}
          }

          return {
            id: n.id,
            type: "mindMap",
            position: { x: n.positionX ?? n.position?.x ?? 0, y: n.positionY ?? n.position?.y ?? 0 },
            data: {
              text: n.text ?? n.data?.text ?? "Untitled",
              description: n.description ?? n.data?.description ?? null,
              icon: n.icon ?? n.data?.icon ?? null,
              color: n.color || n.data?.color || "#0084ff",
              parentId: n.parentId ?? n.data?.parentId ?? null,
              collapsed: Boolean(n.collapsed ?? n.data?.collapsed),
              isRoot: Boolean(n.isRoot ?? n.data?.isRoot),
              imageUrl: n.imageUrl ?? n.data?.imageUrl ?? null,
              videoUrl: n.videoUrl ?? n.data?.videoUrl ?? null,
              linkUrl: n.linkUrl ?? n.data?.linkUrl ?? null,
              linkLabel: n.linkLabel ?? n.data?.linkLabel ?? null,
              customWidth: extra.customWidth ?? n.customWidth ?? n.data?.customWidth ?? null,
              fontFamily: extra.fontFamily ?? n.fontFamily ?? n.data?.fontFamily ?? null,
              fontSize: extra.fontSize ?? n.fontSize ?? n.data?.fontSize ?? null,
              fontStyle: extra.fontStyle ?? n.fontStyle ?? n.data?.fontStyle ?? null,
              textAlign: extra.textAlign ?? n.textAlign ?? n.data?.textAlign ?? null,
              attachments: n.attachments || null,
            },
          };
        });

        const initialEdges: Edge[] = serverEdges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "mindMap",
          data: { color: e.color || e.data?.color || "#0084ff" },
          animated: Boolean(e.animated),
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

  // 2. Realtime Debounced Autosave Trigger
  const triggerAutosave = React.useCallback(
    (currentNodes: Node<MindMapNodeData>[], currentEdges: Edge[]) => {
      if (isInitialLoad.current) return;

      pendingSaveRef.current = { nodes: currentNodes, edges: currentEdges };
      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        executeSave(currentNodes, currentEdges);
      }, 250);
    },
    [executeSave]
  );

  // 3. Unload & Unmount Page Protection Listener (Flushes pending & in-flight changes on unmount/navigation)
  React.useEffect(() => {
    const flushPendingChanges = () => {
      if (isInitialLoad.current) return;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const currentNodes = currentNodesRef.current;
      const currentEdges = currentEdgesRef.current;
      if (!currentNodes || currentNodes.length === 0) return;

      const { nodes: payloadNodes, edges: payloadEdges } = prepareSavePayload(
        currentNodes,
        currentEdges
      );

      try {
        localStorage.setItem(
          `mindmap_backup_${projectId}`,
          JSON.stringify({
            nodes: payloadNodes,
            edges: payloadEdges,
            timestamp: Date.now(),
          })
        );
      } catch {}

      try {
        fetch(`/api/projects/${projectId}/nodes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: payloadNodes, edges: payloadEdges }),
          keepalive: true,
        });
        pendingSaveRef.current = null;
      } catch {}
    };

    window.addEventListener("beforeunload", flushPendingChanges);
    window.addEventListener("pagehide", flushPendingChanges);

    return () => {
      flushPendingChanges();
      window.removeEventListener("beforeunload", flushPendingChanges);
      window.removeEventListener("pagehide", flushPendingChanges);
    };
  }, [projectId, prepareSavePayload]);

  // 3. Update Node Box Width via Corner / Edge Dragging
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

  // Helper: Build hierarchy tree
  const getSubtreeDescendants = React.useCallback(
    (parentId: string): string[] => {
      const childrenMap = new Map<string, string[]>();
      nodes.forEach((n) => childrenMap.set(n.id, []));
      edges.forEach((e) => {
        const list = childrenMap.get(e.source) || [];
        if (!list.includes(e.target)) {
          list.push(e.target);
          childrenMap.set(e.source, list);
        }
      });

      const getRecursive = (id: string): string[] => {
        const direct = childrenMap.get(id) || [];
        let all = [...direct];
        for (const childId of direct) {
          all = all.concat(getRecursive(childId));
        }
        return all;
      };

      return getRecursive(parentId);
    },
    [nodes, edges]
  );

  // =========================================================================
  // 5. STRICT RULE ENFORCEMENT: ADD ARM VS ADD SIBLING
  // =========================================================================

  // ADD ARM: Creates a CHILD of the selected node (one level deeper).
  // newNode.parentId === selectedNode.id
  const handleAddArm = React.useCallback(
    (parentId?: string, direction?: "right" | "left") => {
      const parent = parentId
        ? nodes.find((n) => n.id === parentId)
        : nodes.find((n) => n.id === selectedNodeId || n.selected) || nodes[0];
      if (!parent) return;

      const rootNode = nodes.find((n) => n.data.isRoot || !n.data.parentId) || nodes[0];
      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const branchColor = parent.data.color || "#0084ff";

      // Determine side: Right if right of root, Left if left of root
      let side: "right" | "left" = direction || "right";
      if (!direction) {
        if (parent.id === rootNode.id) {
          const directCount = edges.filter((e) => e.source === parent.id).length;
          side = directCount % 2 === 0 ? "right" : "left";
        } else {
          side = parent.position.x >= rootNode.position.x ? "right" : "left";
        }
      }

      const existingChildren = edges.filter((e) => e.source === parent.id);
      const childCount = existingChildren.length;
      const parentWidth = parent.data.customWidth || (parent.data.isRoot ? 240 : 180);
      const xOffset = side === "right" ? parentWidth + 70 : -(220 + 70);
      const yOffset =
        childCount === 0 ? 0 : (childCount % 2 === 1 ? 1 : -1) * Math.ceil(childCount / 2) * 85;

      const newNode: Node<MindMapNodeData> = {
        id: newId,
        type: "mindMap",
        position: {
          x: parent.position.x + xOffset,
          y: parent.position.y + yOffset,
        },
        data: {
          text: "New Arm",
          description: "",
          icon: null,
          color: branchColor,
          parentId: parent.id, // STRICT RULE: parentId is the selected node
          collapsed: false,
          isRoot: false,
        },
      };

      const newEdge: Edge = {
        id: `edge_${parent.id}_${newId}`,
        source: parent.id, // STRICT RULE: source is parent
        target: newId,
        type: "mindMap",
        data: { color: branchColor },
        animated: true,
      };

      // If parent was collapsed, unfold parent so new arm is visible
      const nextNodes = nodes.map((n) =>
        n.id === parent.id ? { ...n, data: { ...n.data, collapsed: false } } : n
      );
      nextNodes.push(newNode);
      const nextEdges = [...edges, newEdge];

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(newId);
      triggerAutosave(nextNodes, nextEdges);
    },
    [nodes, edges, selectedNodeId, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // ADD SIBLING: Creates a node at the SAME hierarchy level (same parentId).
  // newNode.parentId === selectedNode.parentId
  const handleAddSibling = React.useCallback(
    (targetId?: string) => {
      const selected = targetId
        ? nodes.find((n) => n.id === targetId)
        : nodes.find((n) => n.id === selectedNodeId || n.selected);

      if (!selected || selected.data.isRoot || !selected.data.parentId) {
        toast.info("The root idea has no parent. Click + Arm to add a branch under it.");
        return;
      }

      const parentId = selected.data.parentId;
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return;

      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const branchColor = selected.data.color || parent.data.color || "#0084ff";

      // Place the new sibling directly below the selected sibling
      const newNode: Node<MindMapNodeData> = {
        id: newId,
        type: "mindMap",
        position: {
          x: selected.position.x,
          y: selected.position.y + 80,
        },
        data: {
          text: "New Sibling",
          description: "",
          icon: null,
          color: branchColor,
          parentId: parentId, // STRICT RULE: same parentId as selected node
          collapsed: false,
          isRoot: false,
        },
      };

      const newEdge: Edge = {
        id: `edge_${parentId}_${newId}`,
        source: parentId, // STRICT RULE: source is parent
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
    [nodes, edges, selectedNodeId, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // Execute node deletion
  const executeDelete = React.useCallback(
    (targetId: string) => {
      const node = nodes.find((n) => n.id === targetId);
      if (!node || node.data.isRoot) return;

      const descendants = getSubtreeDescendants(targetId);
      const toDelete = new Set<string>([targetId, ...descendants]);

      const nextNodes = nodes.filter((n) => !toDelete.has(n.id));
      const nextEdges = edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      );

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(null);
      triggerAutosave(nextNodes, nextEdges);
      toast.success(`Removed ${toDelete.size} ${toDelete.size === 1 ? "idea" : "ideas"}`);
    },
    [nodes, edges, getSubtreeDescendants, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  const handleDeleteSelected = React.useCallback(
    (targetId?: string) => {
      const idToDelete = targetId || selectedNodeId || nodes.find((n) => n.selected)?.id;
      if (!idToDelete) return;

      const node = nodes.find((n) => n.id === idToDelete);
      if (!node) return;

      if (node.data.isRoot) {
        toast.info("Central root idea cannot be deleted");
        return;
      }

      const descendants = getSubtreeDescendants(idToDelete);
      if (descendants.length > 0) {
        // Prompt confirmation dialog before deleting entire branch
        setDeleteModalState({
          isOpen: true,
          nodeId: idToDelete,
          nodeTitle: node.data.text || "Untitled",
          descendantCount: descendants.length,
        });
      } else {
        // Leaf node: Delete immediately
        executeDelete(idToDelete);
      }
    },
    [selectedNodeId, nodes, getSubtreeDescendants, executeDelete]
  );

  // COLLAPSE / EXPAND: ONLY toggles node.collapsed. NEVER deletes or alters children!
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
      toast.info(newCollapsed ? "Branch collapsed" : "Branch expanded");
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

  const handleUpdateNodeData = React.useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      const nextNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ...updates,
              },
            }
          : n
      );

      let nextEdges = edges;
      if (updates.color) {
        nextEdges = edges.map((e) =>
          e.source === nodeId ? { ...e, data: { ...e.data, color: updates.color } } : e
        );
      }

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      triggerAutosave(nextNodes, nextEdges);
    },
    [nodes, edges, recordHistory, setNodes, setEdges, triggerAutosave]
  );

  // Duplicate node and its entire subtree
  const handleDuplicateNode = React.useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;

      const idMap = new Map<string, string>();
      const descendants = getSubtreeDescendants(nodeId);
      const allSubtreeIds = [nodeId, ...descendants];

      allSubtreeIds.forEach((oldId) => {
        idMap.set(oldId, `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
      });

      const duplicatedNodes: Node<MindMapNodeData>[] = allSubtreeIds
        .map((oldId) => {
          const original = nodes.find((n) => n.id === oldId);
          if (!original) return null;

          const newId = idMap.get(oldId)!;
          const isTop = oldId === nodeId;
          const newParentId = isTop
            ? original.data.parentId
            : idMap.get(original.data.parentId || "") || original.data.parentId;

          return {
            ...original,
            id: newId,
            position: {
              x: original.position.x + 50,
              y: original.position.y + 60,
            },
            data: {
              ...original.data,
              text: isTop ? `${original.data.text} (Copy)` : original.data.text,
              parentId: newParentId,
              isRoot: false,
            },
          };
        })
        .filter(Boolean) as Node<MindMapNodeData>[];

      const duplicatedEdges: Edge[] = [];
      if (source.data.parentId) {
        duplicatedEdges.push({
          id: `edge_${source.data.parentId}_${idMap.get(nodeId)}`,
          source: source.data.parentId,
          target: idMap.get(nodeId)!,
          type: "mindMap",
          data: { color: source.data.color || "#0084ff" },
          animated: true,
        });
      }

      edges.forEach((e) => {
        if (idMap.has(e.source) && idMap.has(e.target)) {
          duplicatedEdges.push({
            id: `edge_${idMap.get(e.source)}_${idMap.get(e.target)}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
            type: "mindMap",
            data: { color: (e.data as any)?.color || "#0084ff" },
            animated: true,
          });
        }
      });

      const nextNodes = [...nodes, ...duplicatedNodes];
      const nextEdges = [...edges, ...duplicatedEdges];

      recordHistory(nodes, edges);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(idMap.get(nodeId)!);
      triggerAutosave(nextNodes, nextEdges);
      toast.success("Subtree duplicated");
    },
    [nodes, edges, getSubtreeDescendants, recordHistory, setNodes, setEdges, triggerAutosave]
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

  // 6. Subtree Dragging & Drag-and-Drop Reparenting
  const onNodesChangeWithSubtree = React.useCallback(
    (changes: NodeChange<Node<MindMapNodeData>>[]) => {
      setNodes((currentNodes) => {
        let updatedNodes = applyNodeChanges(changes, currentNodes);

        // For position changes, calculate delta and move descendant subtree synchronously
        changes.forEach((change) => {
          if (change.type === "position" && change.position && change.dragging) {
            const prevNode = currentNodes.find((n) => n.id === change.id);
            if (prevNode) {
              const dx = change.position.x - prevNode.position.x;
              const dy = change.position.y - prevNode.position.y;

              if (dx !== 0 || dy !== 0) {
                const descendants = getSubtreeDescendants(change.id);
                if (descendants.length > 0) {
                  const descSet = new Set(descendants);
                  updatedNodes = updatedNodes.map((n) =>
                    descSet.has(n.id)
                      ? {
                          ...n,
                          position: {
                            x: n.position.x + dx,
                            y: n.position.y + dy,
                          },
                        }
                      : n
                  );
                }
              }
            }
          }
        });

        const hasSaveableChange = changes.some(
          (c) => c.type === "position" || c.type === "remove" || c.type === "dimensions"
        );
        if (hasSaveableChange) {
          triggerAutosave(updatedNodes, currentEdgesRef.current);
        }

        return updatedNodes;
      });
    },
    [getSubtreeDescendants, setNodes, triggerAutosave]
  );

  const handleEdgesChange = React.useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setEdges((currentEdges) => {
        const hasSaveableChange = changes.some(
          (c: any) => c.type === "remove" || c.type === "add" || c.type === "reset"
        );
        if (hasSaveableChange) {
          triggerAutosave(currentNodesRef.current, currentEdges);
        }
        return currentEdges;
      });
    },
    [onEdgesChange, setEdges, triggerAutosave]
  );

  const onNodeDrag = React.useCallback(
    (_: any, node: Node) => {
      const overlapNode = nodes.find(
        (n) =>
          n.id !== node.id &&
          Math.abs(n.position.x - node.position.x) < 90 &&
          Math.abs(n.position.y - node.position.y) < 60
      );

      // Prevent dropping on own descendant
      if (overlapNode) {
        const descendants = getSubtreeDescendants(node.id);
        if (descendants.includes(overlapNode.id)) {
          setDragOverNodeId(null);
          return;
        }
      }

      setDragOverNodeId(overlapNode ? overlapNode.id : null);
    },
    [nodes, getSubtreeDescendants]
  );

  const onNodeDragStop = React.useCallback(
    (_: any, node: Node) => {
      if (dragOverNodeId && dragOverNodeId !== node.id) {
        const newParent = nodes.find((n) => n.id === dragOverNodeId);
        const descendants = getSubtreeDescendants(node.id);

        if (newParent && !node.data.isRoot && !descendants.includes(newParent.id)) {
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
            data: { color: newParent.data.color || "#0084ff" },
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
    [dragOverNodeId, nodes, edges, getSubtreeDescendants, recordHistory, setNodes, setEdges, triggerAutosave]
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

  // 9. Arrow Key Navigation
  const handleArrowNavigation = React.useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (!selectedNodeId) return;
      const current = nodes.find((n) => n.id === selectedNodeId);
      if (!current) return;

      const children = edges.filter((e) => e.source === current.id).map((e) => e.target);
      const siblings = current.data.parentId
        ? edges.filter((e) => e.source === current.data.parentId).map((e) => e.target)
        : [];

      let nextTargetId: string | null = null;

      if (direction === "right") {
        if (children.length > 0) {
          nextTargetId = children[Math.floor(children.length / 2)];
        }
      } else if (direction === "left") {
        if (current.data.parentId) {
          nextTargetId = current.data.parentId;
        }
      } else if (direction === "up") {
        const index = siblings.indexOf(current.id);
        if (index > 0) nextTargetId = siblings[index - 1];
      } else if (direction === "down") {
        const index = siblings.indexOf(current.id);
        if (index >= 0 && index < siblings.length - 1) nextTargetId = siblings[index + 1];
      }

      if (nextTargetId) {
        setSelectedNodeId(nextTargetId);
      }
    },
    [selectedNodeId, nodes, edges]
  );

  // 10. Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        handleAddArm();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleAddSibling();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedNodeId(null);
        setContextMenuState((prev) => ({ ...prev, isOpen: false }));
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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedNodeId) handleDuplicateNode(selectedNodeId);
      } else if (e.key === " " || e.key === "/") {
        if (selectedNodeId) {
          e.preventDefault();
          handleToggleCollapse(selectedNodeId);
        }
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dir = e.key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right";
        handleArrowNavigation(dir);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleAddArm,
    handleAddSibling,
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    handleDuplicateNode,
    selectedNodeId,
    handleToggleCollapse,
    handleArrowNavigation,
  ]);

  // Subtree calculation: Map children and recursively hide descendants of collapsed nodes
  const { decoratedNodes, decoratedEdges } = React.useMemo(() => {
    const childrenMap = new Map<string, string[]>();
    nodes.forEach((n) => childrenMap.set(n.id, []));
    edges.forEach((e) => {
      const list = childrenMap.get(e.source) || [];
      if (!list.includes(e.target)) {
        list.push(e.target);
        childrenMap.set(e.source, list);
      }
    });

    const getDescendants = (parentId: string): string[] => {
      const direct = childrenMap.get(parentId) || [];
      let all: string[] = [...direct];
      for (const childId of direct) {
        all = all.concat(getDescendants(childId));
      }
      return all;
    };

    const hiddenNodeIds = new Set<string>();
    nodes.forEach((n) => {
      if (n.data?.collapsed) {
        const descendants = getDescendants(n.id);
        descendants.forEach((id) => hiddenNodeIds.add(id));
      }
    });

    const decoratedNodesList = nodes.map((node) => {
      const directChildren = childrenMap.get(node.id) || [];
      const totalDescendants = getDescendants(node.id);
      const isHidden = hiddenNodeIds.has(node.id);

      return {
        ...node,
        hidden: isHidden,
        selected: node.id === selectedNodeId || Boolean(node.selected),
        data: {
          ...node.data,
          canvasFont,
          childCount: directChildren.length,
          hiddenSubtreeCount: totalDescendants.length,
          isDropTarget: node.id === dragOverNodeId,
          onAddArm: (parentId?: string, direction?: "right" | "left") =>
            handleAddArm(parentId, direction),
          onAddSibling: (nodeId?: string) => handleAddSibling(nodeId),
          onToggleCollapse: (nodeId: string) => handleToggleCollapse(nodeId),
          onUpdateText: (nodeId: string, text: string, desc?: string) =>
            handleUpdateNodeText(nodeId, text, desc),
          onUpdateNodeWidth: handleUpdateNodeWidth,
          onUpdateNodeData: handleUpdateNodeData,
          onDeleteNode: (nodeId: string) => handleDeleteSelected(nodeId),
          onDuplicateNode: (nodeId: string) => handleDuplicateNode(nodeId),
          onOpenInspector: (nodeId: string) => setSelectedNodeId(nodeId),
        },
      };
    });

    const decoratedEdgesList = edges.map((edge) => {
      const isHidden = hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target);
      return {
        ...edge,
        hidden: isHidden,
      };
    });

    return {
      decoratedNodes: decoratedNodesList,
      decoratedEdges: decoratedEdgesList,
    };
  }, [
    nodes,
    edges,
    selectedNodeId,
    dragOverNodeId,
    canvasFont,
    handleAddArm,
    handleAddSibling,
    handleToggleCollapse,
    handleUpdateNodeText,
    handleUpdateNodeWidth,
    handleUpdateNodeData,
    handleDeleteSelected,
    handleDuplicateNode,
  ]);

  const selectedNode = React.useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId || n.selected) || null;
  }, [nodes, selectedNodeId]);

  return (
    <div
      onClick={() => setContextMenuState((prev) => ({ ...prev, isOpen: false }))}
      className={`relative w-full h-screen overflow-hidden bg-background ${getFontClass(canvasFont)}`}
    >
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
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChangeWithSubtree}
        onEdgesChange={handleEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setContextMenuState((prev) => ({ ...prev, isOpen: false }));
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setContextMenuState((prev) => ({ ...prev, isOpen: false }));
        }}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          setSelectedNodeId(node.id);
          setContextMenuState({
            isOpen: true,
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id,
          });
        }}
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
            nodeColor={(n) => ((n.data as any)?.color as string) || "#0084ff"}
            nodeStrokeWidth={3}
            maskColor={isDark ? "rgba(14, 15, 18, 0.75)" : "rgba(251, 251, 250, 0.75)"}
            className="!rounded-xl !border !border-border/80 !shadow-xl !overflow-hidden !bg-card/90 backdrop-blur-xs !bottom-6 !right-6 hidden sm:block"
            zoomable
            pannable
          />
        )}
      </ReactFlow>

      {/* Floating Toolbar with Canva-style tools & Font selector */}
      <FloatingToolbar
        onAddChild={() => handleAddArm()}
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
            handleUpdateNodeData(id, updates);
          }}
          onDelete={(id) => handleDeleteSelected(id)}
          onAddChild={(id) => handleAddArm(id)}
          onToggleCollapse={(id) => handleToggleCollapse(id)}
        />
      )}

      {/* Right-Click Context Menu */}
      {contextMenuState.isOpen && contextMenuState.nodeId && (
        <div
          style={{ top: `${contextMenuState.y}px`, left: `${contextMenuState.x}px` }}
          className="fixed z-50 w-52 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-1 text-xs text-foreground space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add Arm (Child of this node) */}
          <button
            type="button"
            onClick={() => {
              handleAddArm(contextMenuState.nodeId!);
              setContextMenuState((prev) => ({ ...prev, isOpen: false }));
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>+ Arm (Child)</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Tab</span>
          </button>

          {/* Add Sibling (Same parent level — only if not root) */}
          {!nodes.find((n) => n.id === contextMenuState.nodeId)?.data.isRoot && (
            <button
              type="button"
              onClick={() => {
                handleAddSibling(contextMenuState.nodeId!);
                setContextMenuState((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span>+ Sibling</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Enter</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              handleDuplicateNode(contextMenuState.nodeId!);
              setContextMenuState((prev) => ({ ...prev, isOpen: false }));
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Duplicate Subtree</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Ctrl+D</span>
          </button>

          {/* Collapse / Expand — ONLY if node has at least one child */}
          {(nodes.find((n) => n.id === contextMenuState.nodeId)?.data.childCount || 0) > 0 ? (
            <button
              type="button"
              onClick={() => {
                handleToggleCollapse(contextMenuState.nodeId!);
                setContextMenuState((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {nodes.find((n) => n.id === contextMenuState.nodeId)?.data.collapsed ? (
                  <UnfoldHorizontal className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <FoldHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>
                  {nodes.find((n) => n.id === contextMenuState.nodeId)?.data.collapsed
                    ? "Expand Branch"
                    : "Collapse Branch"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Space</span>
            </button>
          ) : null}

          <div className="h-px bg-border/80 my-1" />

          {!nodes.find((n) => n.id === contextMenuState.nodeId)?.data.isRoot && (
            <button
              type="button"
              onClick={() => {
                handleDeleteSelected(contextMenuState.nodeId!);
                setContextMenuState((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Del</span>
            </button>
          )}
        </div>
      )}

      {/* Subtree Deletion Confirmation Modal */}
      <Dialog
        open={deleteModalState.isOpen}
        onOpenChange={(open) =>
          setDeleteModalState((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <span>Delete branch subtree?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Deleting &quot;<strong className="text-foreground">{deleteModalState.nodeTitle}</strong>&quot; will also remove its{" "}
              <strong className="text-foreground">{deleteModalState.descendantCount} connected sub-topics</strong>. You can undo this change anytime with <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">Ctrl+Z</kbd>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteModalState.nodeId) {
                  executeDelete(deleteModalState.nodeId);
                }
                setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              Delete Subtree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
