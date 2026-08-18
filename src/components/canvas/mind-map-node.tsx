"use client";

import * as React from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Link2,
  ExternalLink,
  Play,
} from "lucide-react";
import { parseMediaUrl } from "@/lib/media-parser";
import { getFontClass } from "@/lib/fonts";

export type MindMapNodeData = {
  text: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  parentId?: string | null;
  collapsed?: boolean;
  isRoot?: boolean;
  childCount?: number;
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
  onOpenInspector?: (nodeId: string) => void;
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

  // Dynamic Node Box Width (resizable via right-edge dot)
  const defaultWidth = data.isRoot ? 240 : data.imageUrl ? 280 : 200;
  const [currentWidth, setCurrentWidth] = React.useState<number>(
    data.customWidth || defaultWidth
  );
  const [isResizing, setIsResizing] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditText(data.text || "New Idea");
    setEditDesc(data.description || "");
  }, [data.text, data.description]);

  React.useEffect(() => {
    if (data.customWidth) {
      setCurrentWidth(data.customWidth);
    } else {
      setCurrentWidth(data.isRoot ? 240 : data.imageUrl ? 280 : 200);
    }
  }, [data.customWidth, data.imageUrl, data.isRoot]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (data.onUpdateText && editText.trim()) {
      data.onUpdateText(id, editText.trim(), editDesc.trim() || undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFinishEditing();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(data.text || "New Idea");
    }
  };

  // Drag-to-Resize Entire Node Box from Right Edge Dot
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const initialWidth = currentWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(850, initialWidth + deltaX));
      setCurrentWidth(newWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);

      const deltaX = upEvent.clientX - startX;
      const finalWidth = Math.max(160, Math.min(850, initialWidth + deltaX));
      if (data.onUpdateNodeWidth) {
        data.onUpdateNodeWidth(id, finalWidth);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const nodeColor = data.color || "#6366f1";
  const isRoot = data.isRoot || !data.parentId;
  const hasChildren = (data.childCount || 0) > 0;

  const fontClass = getFontClass(data.fontFamily || (data.canvasFont as string));
  const parsedVideo = parseMediaUrl(data.videoUrl);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => setIsEditing(true)}
      className={`group relative rounded-xl border transition-all duration-150 select-none ${fontClass} ${
        data.isDropTarget
          ? "ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-xl"
          : ""
      } ${
        selected
          ? "border-primary ring-2 ring-primary/40 shadow-lg dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          : "border-border/80 bg-card hover:border-primary/50 hover:shadow-md"
      } ${
        isRoot
          ? "p-4 bg-gradient-to-br from-card to-muted/40 font-bold"
          : "p-3 bg-card text-foreground"
      } ${isResizing ? "ring-2 ring-primary ring-offset-1" : ""}`}
      style={{
        width: `${currentWidth}px`,
        borderLeftColor: nodeColor,
        borderLeftWidth: isRoot ? "6px" : "4px",
      }}
    >
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
            <div className="space-y-1">
              <input
                ref={inputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleFinishEditing}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border border-primary rounded-md px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <div className="space-y-0.5">
              <h4
                className={`tracking-tight text-foreground break-words ${
                  data.fontSize === "2xl"
                    ? "text-lg font-bold"
                    : data.fontSize === "xl"
                    ? "text-base font-bold"
                    : data.fontSize === "lg"
                    ? "text-sm font-semibold"
                    : isRoot
                    ? "text-sm font-bold"
                    : "text-xs font-semibold leading-snug"
                } ${data.fontStyle === "italic" ? "italic" : ""} ${
                  data.textAlign === "center" ? "text-center" : data.textAlign === "right" ? "text-right" : "text-left"
                }`}
              >
                {data.text || "Untitled"}
              </h4>
            </div>
          )}
        </div>
      </div>

      {/* ORIGINAL SIZE IMAGE ATTACHMENT: Resizes dynamically with the whole box */}
      {data.imageUrl && (
        <div className="mt-2.5 w-full rounded-lg overflow-hidden border border-border/70 bg-muted/10 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt="attachment"
            className="w-full h-auto object-contain block rounded-lg max-h-[500px]"
          />
        </div>
      )}

      {/* Video Attachment (Embed or Native) */}
      {data.videoUrl && (
        <div className="mt-2.5 w-full rounded-lg overflow-hidden border border-border/70 bg-black/10">
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
            <video src={data.videoUrl} controls className="w-full h-auto max-h-[400px] rounded-lg" />
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
        <div className="pt-1.5">
          <a
            href={data.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 max-w-full text-[10px] font-medium text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-md transition-colors truncate"
            title={data.linkUrl}
          >
            <Link2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{data.linkLabel || "Attached Link"}</span>
            <ExternalLink className="h-2 w-2 shrink-0 opacity-70" />
          </a>
        </div>
      )}

      {/* Collapse / Expand Badge */}
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(id);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-5.5 px-1 rounded-full bg-background border border-border shadow-xs hover:border-primary flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-all z-20"
          title={data.collapsed ? "Expand branch" : "Collapse branch"}
        >
          {data.collapsed ? (
            <>
              <ChevronRight className="h-3 w-3 text-primary" />
              <span className="font-semibold text-[9px] pr-0.5">{data.childCount}</span>
            </>
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}

      {/* "+" Affix Hover Button for Quick Child Creation */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onAddChild?.(id, "right");
        }}
        className={`absolute -right-3.5 -bottom-2 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 active:scale-95 flex items-center justify-center transition-all z-30 ${
          isHovered && !data.collapsed ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        }`}
        title="Add child node (Tab)"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* RIGHT EDGE RESIZE DOT: Drag this dot to freely adjust size of the whole node and its image */}
      {(selected || isHovered || isResizing) && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute -right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-125 active:scale-95 transition-all z-40"
          title="Drag this dot to resize the entire node box and image"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-background" />
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
