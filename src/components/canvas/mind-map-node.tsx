"use client";

import * as React from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Link2, ExternalLink, Minus, Plus } from "lucide-react";
import { parseMediaUrl } from "@/lib/media-parser";
import { getFontClass } from "@/lib/fonts";
import { FloatingNodeToolbar } from "./floating-node-toolbar";

export type MindMapNodeData = {
  text: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  parentId?: string | null;
  collapsed?: boolean;
  isRoot?: boolean;
  childCount?: number;
  hiddenSubtreeCount?: number;
  isDropTarget?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  customWidth?: number | null;
  fontFamily?: string | null;
  fontSize?: string | null;
  fontWeight?: string | null;
  fontStyle?: string | null;
  textAlign?: string | null;
  canvasFont?: string | null;
  onAddArm?: (parentId: string, direction?: "right" | "left") => void;
  onAddSibling?: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onUpdateText?: (nodeId: string, text: string, description?: string) => void;
  onUpdateNodeWidth?: (nodeId: string, width: number) => void;
  onUpdateNodeData?: (nodeId: string, updates: Record<string, unknown>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  [key: string]: unknown;
};

export function MindMapNodeComponent({
  id,
  data,
  selected,
}: NodeProps<Node<MindMapNodeData>>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(data.text || "New Idea");
  const [editDesc, setEditDesc] = React.useState(data.description || "");
  const [isHovered, setIsHovered] = React.useState(false);

  // Dynamic Node Box Width
  const defaultWidth = data.isRoot ? 240 : data.imageUrl ? 280 : 180;
  const [currentWidth, setCurrentWidth] = React.useState<number>(
    data.customWidth || defaultWidth
  );
  const [isResizing, setIsResizing] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const resizeStartRef = React.useRef<{ startX: number; initialWidth: number }>({
    startX: 0,
    initialWidth: defaultWidth,
  });

  React.useEffect(() => {
    setEditText(data.text || "New Idea");
    setEditDesc(data.description || "");
  }, [data.text, data.description]);

  React.useEffect(() => {
    if (data.customWidth) {
      setCurrentWidth(data.customWidth);
    } else {
      setCurrentWidth(data.isRoot ? 240 : data.imageUrl ? 280 : 180);
    }
  }, [data.customWidth, data.imageUrl, data.isRoot]);

  // Auto-resize textarea height when editing
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (data.onUpdateText && editText.trim()) {
      data.onUpdateText(id, editText.trim(), editDesc.trim() || undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFinishEditing();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(data.text || "New Idea");
    }
  };

  // =========================================================================
  // CORNER RESIZE DOT (Bottom-right circular grip)
  // =========================================================================
  const handlePointerDownCornerResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      initialWidth: currentWidth,
    };
  };

  const handlePointerMoveCornerResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    e.stopPropagation();
    e.preventDefault();

    const deltaX = e.clientX - resizeStartRef.current.startX;
    const newWidth = Math.max(140, Math.min(900, resizeStartRef.current.initialWidth + deltaX));
    setCurrentWidth(newWidth);
  };

  const handlePointerUpCornerResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsResizing(false);
    const deltaX = e.clientX - resizeStartRef.current.startX;
    const finalWidth = Math.max(140, Math.min(900, resizeStartRef.current.initialWidth + deltaX));

    if (data.onUpdateNodeWidth) {
      data.onUpdateNodeWidth(id, finalWidth);
    }
  };

  const nodeColor = data.color || "#0084ff";
  const isRoot = data.isRoot || !data.parentId;
  const childCount = data.childCount || 0;
  // STRICT RULE: Only show collapse/expand if the node has at least one child
  const hasChildren = childCount > 0;

  const fontClass = getFontClass(data.fontFamily || (data.canvasFont as string));
  const parsedVideo = parseMediaUrl(data.videoUrl);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => setIsEditing(true)}
      className={`group relative rounded-2xl transition-all duration-150 select-none ${fontClass} ${
        data.isDropTarget
          ? "ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-xl"
          : ""
      } ${
        selected
          ? "border-2 shadow-lg bg-card ring-2 ring-primary/20"
          : "border-2 hover:shadow-md bg-card"
      } ${
        isRoot
          ? "p-4 text-center font-bold"
          : "p-2.5 text-foreground"
      } ${isResizing ? "ring-2 ring-primary ring-offset-1" : ""}`}
      style={{
        width: `${currentWidth}px`,
        borderColor: selected ? nodeColor : isHovered ? nodeColor : "var(--border)",
      }}
    >
      {/* Floating Contextual Toolbar above Node (Visible ONLY when selected) */}
      <FloatingNodeToolbar
        nodeId={id}
        selected={Boolean(selected)}
        data={{
          text: data.text,
          description: data.description,
          color: data.color,
          isRoot: data.isRoot,
          parentId: data.parentId,
          childCount: data.childCount,
          collapsed: data.collapsed,
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl,
          fontFamily: data.fontFamily,
          fontSize: data.fontSize,
          fontStyle: data.fontStyle,
          textAlign: data.textAlign,
        }}
        onUpdate={(updates) => data.onUpdateNodeData?.(id, updates)}
        onAddArm={(dir) => data.onAddArm?.(id, dir)}
        onAddSibling={() => data.onAddSibling?.(id)}
        onToggleCollapse={() => data.onToggleCollapse?.(id)}
        onDelete={() => data.onDeleteNode?.(id)}
        onDuplicate={() => data.onDuplicateNode?.(id)}
      />

      {/* Target Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-primary !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-primary !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Header Row: Emoji Icon + Title */}
      <div className="flex items-start gap-2">
        {data.icon && (
          <span className="text-base shrink-0 select-none mt-0.5" role="img" aria-label="node icon">
            {data.icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              rows={1}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onBlur={handleFinishEditing}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border border-primary rounded-md px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden"
            />
          ) : (
            <h4
              className={`tracking-tight text-foreground break-words ${
                data.fontSize === "2xl"
                  ? "text-lg font-bold"
                  : data.fontSize === "xl"
                  ? "text-base font-bold"
                  : data.fontSize === "lg"
                  ? "text-sm font-semibold"
                  : isRoot
                  ? "text-base font-bold"
                  : "text-xs font-medium leading-snug"
              } ${data.fontStyle === "italic" ? "italic" : ""} ${
                data.textAlign === "center" || isRoot
                  ? "text-center"
                  : data.textAlign === "right"
                  ? "text-right"
                  : "text-left"
              }`}
            >
              {data.text || "Untitled"}
            </h4>
          )}
        </div>
      </div>

      {/* Original Size Image Attachment */}
      {data.imageUrl && (
        <div className="mt-2 w-full rounded-xl overflow-hidden border border-border/60 bg-muted/10 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt="attachment"
            className="w-full h-auto object-contain block rounded-xl max-h-[500px]"
          />
        </div>
      )}

      {/* Video Attachment */}
      {data.videoUrl && (
        <div className="mt-2 w-full rounded-xl overflow-hidden border border-border/60 bg-black/10">
          {parsedVideo?.type === "youtube" && parsedVideo.embedUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={parsedVideo.embedUrl}
                title="YouTube embed"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          ) : parsedVideo?.type === "vimeo" && parsedVideo.embedUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={parsedVideo.embedUrl}
                title="Vimeo embed"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={data.videoUrl} controls className="w-full h-auto max-h-[400px] rounded-xl" />
          )}
        </div>
      )}

      {/* Description / Supporting Notes */}
      {data.description && (
        <p
          className={`mt-1 text-[11px] text-muted-foreground leading-tight break-words ${
            data.textAlign === "center" ? "text-center" : data.textAlign === "right" ? "text-right" : "text-left"
          }`}
        >
          {data.description}
        </p>
      )}

      {/* External File / Link Chip */}
      {data.linkUrl && (
        <div className="pt-1">
          <a
            href={data.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 max-w-full text-[10px] font-medium text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-md transition-colors truncate"
            title={data.linkUrl}
          >
            <Link2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{data.linkLabel || data.linkUrl}</span>
            <ExternalLink className="h-2 w-2 shrink-0 opacity-70" />
          </a>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CORNER RESIZE DOT (Bottom-right corner dot on selected node)          */}
      {/* ========================================================================= */}
      {selected && (
        <div
          onPointerDown={handlePointerDownCornerResize}
          onPointerMove={handlePointerMoveCornerResize}
          onPointerUp={handlePointerUpCornerResize}
          className="nodrag nopan absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-card cursor-nwse-resize z-30 shadow-xs hover:scale-150 active:scale-125 transition-transform"
          style={{ borderColor: nodeColor }}
          title="Drag corner to resize box"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. COLLAPSE / EXPAND CONTROL (Only if node HAS children)                  */}
      {/* ========================================================================= */}
      {hasChildren && (
        <div
          className="nodrag nopan group/collapse absolute -right-7 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-pointer z-30"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(id);
          }}
        >
          <div
            className={`w-5 h-5 rounded-full border bg-card text-foreground flex items-center justify-center shadow-md transition-all duration-150 ${
              selected || isHovered
                ? "opacity-100 scale-100"
                : "opacity-40 hover:opacity-100 hover:scale-110"
            }`}
            style={{ borderColor: nodeColor }}
            title={data.collapsed ? "Expand branch (Space)" : "Collapse branch (Space)"}
          >
            {data.collapsed ? (
              <Plus className="h-3 w-3 stroke-[2.5]" style={{ color: nodeColor }} />
            ) : (
              <Minus className="h-3 w-3 stroke-[2.5]" style={{ color: nodeColor }} />
            )}
          </div>

          {/* Dark Tooltip */}
          <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/collapse:opacity-100 transition-opacity pointer-events-none bg-[#2d3139] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
            {data.collapsed ? "Expand" : "Collapse"}
          </div>
        </div>
      )}

      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-primary !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-primary !border-2 !border-background opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
