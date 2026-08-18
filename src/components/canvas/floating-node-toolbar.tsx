"use client";

import * as React from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FONT_OPTIONS } from "@/lib/fonts";
import {
  Plus,
  GitBranch,
  Sparkles,
  Palette,
  Type,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  Copy,
  Trash2,
  FoldHorizontal,
  UnfoldHorizontal,
  AlignCenter,
  Italic,
} from "lucide-react";
import { toast } from "sonner";

interface FloatingNodeToolbarProps {
  nodeId: string;
  selected: boolean;
  data: {
    text: string;
    description?: string | null;
    color?: string;
    isRoot?: boolean;
    parentId?: string | null;
    childCount?: number;
    collapsed?: boolean;
    imageUrl?: string | null;
    linkUrl?: string | null;
    fontFamily?: string | null;
    fontSize?: string | null;
    fontStyle?: string | null;
    textAlign?: string | null;
  };
  onUpdate: (updates: Record<string, unknown>) => void;
  onAddArm: (direction?: "right" | "left") => void;
  onAddSibling: () => void;
  onToggleCollapse: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const PRESET_COLORS = [
  { name: "Blue", hex: "#0084ff" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Slate", hex: "#64748b" },
];

export function FloatingNodeToolbar({
  nodeId,
  selected,
  data,
  onUpdate,
  onAddArm,
  onAddSibling,
  onToggleCollapse,
  onDelete,
  onDuplicate,
}: FloatingNodeToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isLinkPromptOpen, setIsLinkPromptOpen] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState(data.linkUrl || "");

  const canAddSibling = Boolean(data.parentId && !data.isRoot);
  const canAddArm = true;
  const hasChildren = (data.childCount ?? 0) > 0;

  // AI Brainstorm Subtopics Generator
  const handleAIBrainstorm = () => {
    const title = data.text || "Idea";
    const aiIdeas: Record<string, string[]> = {
      default: [`Key Drivers of ${title}`, `Challenges & Risks`, `Action Plan & Next Steps`],
      intro: ["Overview & Context", "Goals & Objectives", "Target Audience"],
      strategy: ["Market Analysis", "Competitive Advantage", "Execution Timeline"],
      roadmap: ["Phase 1: Discovery", "Phase 2: Build & Test", "Phase 3: Launch"],
    };

    const key = title.toLowerCase().includes("intro")
      ? "intro"
      : title.toLowerCase().includes("strat")
      ? "strategy"
      : title.toLowerCase().includes("road")
      ? "roadmap"
      : "default";

    const suggestions = aiIdeas[key] || aiIdeas.default;
    toast.success(`Generated 3 sub-ideas for "${title}"`);
    suggestions.forEach(() => {
      onAddArm("right");
    });
  };

  // Image Upload Handler
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const uploadData = await res.json();
      onUpdate({ imageUrl: uploadData.url, customWidth: data.imageUrl ? undefined : 320 });
      toast.success("Image attached successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Top}
      offset={12}
      className="nodrag nopan flex items-center gap-1 p-1 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Hidden File Input for Direct Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />

      {/* 1. Add Sibling Button (Only if not root and has parent) */}
      {canAddSibling && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddSibling();
          }}
          className="h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
          title="Add Sibling (same parent level) — Enter"
        >
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          <span>+ Sibling</span>
        </button>
      )}

      {/* 2. Add Arm Button (Child of selected node) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddArm("right");
        }}
        className="h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors shrink-0"
        title="Add Arm (child branch under this node) — Tab"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>+ Arm</span>
      </button>

      <span className="h-3.5 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* 3. AI Sparkle Brainstorm */}
      <button
        type="button"
        onClick={handleAIBrainstorm}
        className="h-7 w-7 rounded-xl flex items-center justify-center text-purple-500 hover:bg-purple-500/15 transition-colors shrink-0"
        title="AI Brainstorm: Generate sub-topics"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      {/* 4. Color & Style Palette Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Color & Style"
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="p-2 w-48 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground">Branch Color</div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onUpdate({ color: c.hex })}
                className={`h-7 rounded-lg transition-transform ${
                  data.color === c.hex ? "ring-2 ring-foreground scale-105" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 5. Typography & Font Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Text formatting & Font"
          >
            <Type className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="p-2 w-56 space-y-2.5">
          <div className="text-[11px] font-semibold text-muted-foreground">Font Family</div>
          <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onUpdate({ fontFamily: f.id })}
                className={`p-1.5 rounded text-left text-xs ${f.className} ${
                  data.fontFamily === f.id || (!data.fontFamily && f.id === "inter")
                    ? "bg-primary/15 text-primary font-semibold"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
              {["sm", "base", "lg", "xl"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ fontSize: s })}
                  className={`h-6 px-1.5 text-[10px] font-semibold rounded ${
                    (data.fontSize || "base") === s ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => onUpdate({ fontStyle: data.fontStyle === "italic" ? "normal" : "italic" })}
                className={`h-6 w-6 rounded flex items-center justify-center ${
                  data.fontStyle === "italic" ? "bg-background text-primary" : "text-muted-foreground"
                }`}
                title="Italic"
              >
                <Italic className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ textAlign: data.textAlign === "center" ? "left" : "center" })}
                className={`h-6 w-6 rounded flex items-center justify-center ${
                  data.textAlign === "center" ? "bg-background text-primary" : "text-muted-foreground"
                }`}
                title="Center text"
              >
                <AlignCenter className="h-3 w-3" />
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 6. Image Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`h-7 w-7 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          data.imageUrl
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        title={data.imageUrl ? "Replace image" : "Attach image"}
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      {/* 7. Link Attachment Dropdown */}
      <DropdownMenu open={isLinkPromptOpen} onOpenChange={setIsLinkPromptOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`h-7 w-7 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
              data.linkUrl
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={data.linkUrl ? `Link: ${data.linkUrl}` : "Attach URL link"}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="p-2.5 w-64 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground">Attach Reference URL</div>
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://..."
            className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center justify-end gap-1.5 pt-1">
            {data.linkUrl && (
              <button
                type="button"
                onClick={() => {
                  onUpdate({ linkUrl: null });
                  setLinkInput("");
                  setIsLinkPromptOpen(false);
                }}
                className="text-[11px] text-destructive hover:underline px-2 py-1"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (linkInput.trim()) {
                  onUpdate({ linkUrl: linkInput.trim() });
                  toast.success("Link saved");
                }
                setIsLinkPromptOpen(false);
              }}
              className="text-[11px] bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded-lg"
            >
              Save Link
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="h-3.5 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* 8. More Actions Dropdown (Duplicate, Collapse/Expand, Delete) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer text-xs">
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Duplicate subtree</span>
          </DropdownMenuItem>

          {hasChildren && (
            <DropdownMenuItem onClick={onToggleCollapse} className="cursor-pointer text-xs">
              {data.collapsed ? (
                <>
                  <UnfoldHorizontal className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span>Expand subtree</span>
                </>
              ) : (
                <>
                  <FoldHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Collapse subtree</span>
                </>
              )}
            </DropdownMenuItem>
          )}

          {data.imageUrl && (
            <DropdownMenuItem
              onClick={() => onUpdate({ imageUrl: null })}
              className="cursor-pointer text-xs text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span>Remove image</span>
            </DropdownMenuItem>
          )}

          {!data.isRoot && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                <span>Delete node</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </NodeToolbar>
  );
}
