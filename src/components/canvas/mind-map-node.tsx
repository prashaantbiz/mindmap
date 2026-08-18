"use client";

import * as React from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Plus, Link2, ExternalLink } from "lucide-react";
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
  onAddChild?: (parentId: string, direction?: "right" | "left") => void;
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
  // CORNER RESIZE DOT (MindMeister bottom-right circular grip)
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
  const hasChildren = childCount > 0 || Boolean(data.collapsed);

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
          ? "border-2 shadow-lg bg-card"
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
      {/* Floating Contextual Toolbar above Node (MindMeister Style) */}
      <FloatingNodeToolbar
        nodeId={id}
        selected={Boolean(selected)}
        data={{
          text: data.text,
          description: data.description,
          color: data.color,
          isRoot: data.isRoot,
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
        onAddChild={(dir) => data.onAddChild?.(id, dir)}
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

      {/* ORIGINAL SIZE IMAGE ATTACHMENT: Resizes dynamically with the whole box */}
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

      {/* Video Attachment (Embed or Native) */}
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
      {/* 1. MINDMEISTER RESIZE CORNER DOT (Exact bottom-right corner dot)          */}
      {/* ========================================================================= */}
      {selected && (
        <div
          onPointerDown={handlePointerDownCornerResize}
          onPointerMove={handlePointerMoveCornerResize}
          onPointerUp={handlePointerUpCornerResize}
          className="nodrag nopan absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-card cursor-nwse-resize z-30 shadow-xs hover:scale-150 active:scale-125 transition-transform"
          style={{ borderColor: nodeColor }}
          title="Drag this corner dot to resize box and image"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. MINDMEISTER COLLAPSE / EXPAND RING DOT (On branch connector line)     */}
      {/* ========================================================================= */}
      {hasChildren && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(id);
          }}
          className="nodrag nopan group/dot absolute -right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-card cursor-pointer hover:scale-125 transition-transform flex items-center justify-center shadow-xs z-30"
          style={{ borderColor: nodeColor }}
        >
          {/* Inner solid dot if collapsed (Image 3), hollow if expanded (Image 2) */}
          {data.collapsed && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nodeColor }} />
          )}

          {/* Tooltip (Collapse / Expand) */}
          <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none bg-[#2d3139] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
            {data.collapsed ? "Expand" : "Collapse"}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MINDMEISTER PLUS (+) BUTTON & SHORTCUT HINTS (Exact match to Image 1) */}
      {/* ========================================================================= */}
      {(selected || isHovered) && (
        <div className="nodrag nopan absolute -right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 z-30">
          {/* Plus Circle Button */}
          <div className="group/plus relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onAddChild?.(id, "right");
              }}
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              style={{ backgroundColor: nodeColor }}
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* "Add child" Tooltip */}
            <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/plus:opacity-100 transition-opacity pointer-events-none bg-[#2d3139] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
              Add child
            </div>
          </div>

          {/* Keyboard Hint Badges (Image 1 & 3) */}
          {selected && (
            <div className="flex flex-col gap-1 pointer-events-none select-none shrink-0 whitespace-nowrap pl-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded-md border border-border bg-card shadow-xs font-semibold text-[10px] text-foreground">
                  Tab
                </span>
                <span>to create child</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded-md border border-border bg-card shadow-xs font-semibold text-[10px] text-foreground">
                  Enter
                </span>
                <span>to create sibling</span>
              </div>
            </div>
          )}
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
