"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMediaUrl } from "@/lib/media-parser";
import { FONT_OPTIONS } from "@/lib/fonts";
import { toast } from "sonner";
import {
  X,
  Trash2,
  Plus,
  Palette,
  Smile,
  Image as ImageIcon,
  Video,
  Link2,
  ExternalLink,
  UploadCloud,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Scaling,
  FoldHorizontal,
  UnfoldHorizontal,
} from "lucide-react";

interface NodeInspectorPanelProps {
  node: {
    id: string;
    data: {
      text: string;
      description?: string | null;
      icon?: string | null;
      color?: string;
      isRoot?: boolean;
      childCount?: number;
      hiddenSubtreeCount?: number;
      collapsed?: boolean;
      parentId?: string | null;
      imageUrl?: string | null;
      videoUrl?: string | null;
      linkUrl?: string | null;
      linkLabel?: string | null;
      customWidth?: number | null;
      fontFamily?: string | null;
      fontSize?: string | null;
      fontStyle?: string | null;
      textAlign?: string | null;
    };
    position: { x: number; y: number };
  } | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    updates: Partial<{
      text: string;
      description: string;
      color: string;
      icon: string;
      imageUrl: string | null;
      videoUrl: string | null;
      linkUrl: string | null;
      linkLabel: string | null;
      customWidth: number | null;
      fontFamily: string | null;
      fontSize: string | null;
      fontStyle: string | null;
      textAlign: string | null;
      collapsed: boolean;
    }>
  ) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
}

const EMOJI_OPTIONS = ["💡", "🎯", "⚡", "🔍", "📚", "🚀", "🔥", "⭐", "🛠️", "📊", "🧠", "✨"];
const PRESET_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#f43f5e", "#64748b"];

export function NodeInspectorPanel({
  node,
  onClose,
  onUpdate,
  onDelete,
  onAddChild,
  onToggleCollapse,
}: NodeInspectorPanelProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragOverUpload, setDragOverUpload] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!node) return null;

  const { data, id } = node;
  const isRoot = data.isRoot || !data.parentId;
  const childCount = data.childCount || 0;
  const hiddenCount = data.hiddenSubtreeCount || childCount;
  const hasChildren = childCount > 0 || Boolean(data.collapsed);

  // File Upload Handler
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

      if (file.type.startsWith("video/")) {
        onUpdate(id, { videoUrl: uploadData.url, imageUrl: null });
        toast.success("Video attached successfully");
      } else {
        onUpdate(id, { imageUrl: uploadData.url, videoUrl: null, customWidth: data.customWidth || 320 });
        toast.success("Image attached successfully");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const parsedVideo = parseMediaUrl(data.videoUrl);
  const currentBoxWidth = data.customWidth || (data.isRoot ? 240 : data.imageUrl ? 280 : 200);

  return (
    <div className="absolute top-16 sm:top-20 right-3 sm:right-6 z-40 w-88 max-w-[calc(100vw-24px)] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/10 dark:shadow-black/60 p-4 space-y-3.5 animate-in slide-in-from-right-4 duration-150 max-h-[calc(100vh-90px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color || "#6366f1" }}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {isRoot ? "Root Idea" : "Node Inspector"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid grid-cols-3 h-8 p-0.5 bg-muted/50 rounded-xl mb-3">
          <TabsTrigger value="content" className="text-[11px] h-7 rounded-lg font-medium">
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="text-[11px] h-7 rounded-lg font-medium flex items-center gap-1">
            <span>Media</span>
            {(data.imageUrl || data.videoUrl) && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </TabsTrigger>
          <TabsTrigger value="links" className="text-[11px] h-7 rounded-lg font-medium flex items-center gap-1">
            <span>Links</span>
            {data.linkUrl && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Content & Typography */}
        <TabsContent value="content" className="space-y-3.5 mt-0">
          <div className="space-y-1">
            <Label htmlFor="node-title" className="text-[11px] text-muted-foreground font-semibold">
              Title
            </Label>
            <Input
              id="node-title"
              value={data.text || ""}
              onChange={(e) => onUpdate(id, { text: e.target.value })}
              className="h-8.5 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="node-desc" className="text-[11px] text-muted-foreground font-semibold">
              Description / Notes
            </Label>
            <textarea
              id="node-desc"
              value={data.description || ""}
              onChange={(e) => onUpdate(id, { description: e.target.value })}
              placeholder="Add supporting details..."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Node Box Width Slider & Presets (Canva / MindMeister style) */}
          <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <Label className="font-semibold text-foreground flex items-center gap-1">
                <Scaling className="h-3.5 w-3.5 text-primary" />
                <span>Box & Image Width</span>
              </Label>
              <span className="text-primary font-mono font-bold text-[11px] bg-primary/10 px-1.5 py-0.5 rounded-md">
                {currentBoxWidth}px
              </span>
            </div>

            <input
              type="range"
              min={160}
              max={880}
              step={10}
              value={currentBoxWidth}
              onChange={(e) => onUpdate(id, { customWidth: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {[
                { label: "Compact", width: 200 },
                { label: "Standard", width: 300 },
                { label: "Wide", width: 460 },
                { label: "Full", width: 680 },
              ].map((p) => (
                <button
                  key={p.width}
                  type="button"
                  onClick={() => onUpdate(id, { customWidth: p.width })}
                  className={`text-[10px] py-1 px-1 rounded-md border text-center transition-all ${
                    currentBoxWidth === p.width
                      ? "border-primary bg-primary/15 text-primary font-bold"
                      : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
              <span>💡 You can also drag the right edge handle directly on canvas!</span>
            </p>
          </div>

          {/* Subtree Collapse / Expand Controls */}
          {hasChildren && (
            <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {data.collapsed ? (
                    <FoldHorizontal className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <UnfoldHorizontal className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  <span>Subtree Folding</span>
                </span>
                <Badge variant={data.collapsed ? "secondary" : "outline"} className="text-[10px] h-4.5 px-1.5">
                  {data.collapsed ? `${hiddenCount} collapsed` : `${childCount} direct children`}
                </Badge>
              </div>

              <Button
                type="button"
                variant={data.collapsed ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleCollapse?.(id)}
                className="w-full h-8 text-xs font-semibold gap-1.5 shadow-xs"
              >
                {data.collapsed ? (
                  <>
                    <UnfoldHorizontal className="h-3.5 w-3.5" />
                    <span>Expand Branch (+{hiddenCount} ideas)</span>
                  </>
                ) : (
                  <>
                    <FoldHorizontal className="h-3.5 w-3.5" />
                    <span>Collapse Branch (Fold subtree)</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Typography Customization */}
          <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Type className="h-3.5 w-3.5 text-primary" />
                <span>Font & Typography</span>
              </Label>
              {data.fontFamily && (
                <button
                  type="button"
                  onClick={() => onUpdate(id, { fontFamily: null, fontSize: null, fontStyle: null, textAlign: null })}
                  className="text-[10px] text-muted-foreground hover:text-primary"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Font Family Selection */}
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-background rounded-lg border border-border/60">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdate(id, { fontFamily: f.id })}
                  className={`p-1.5 rounded-md text-left transition-all ${f.className} ${
                    data.fontFamily === f.id || (!data.fontFamily && f.id === "inter")
                      ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="text-xs">{f.name}</div>
                  <div className="text-[9px] opacity-70 truncate">{f.category}</div>
                </button>
              ))}
            </div>

            {/* Size & Alignment Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 bg-background border border-border/70 rounded-lg p-0.5">
                {[
                  { label: "S", value: "sm" },
                  { label: "M", value: "base" },
                  { label: "L", value: "lg" },
                  { label: "XL", value: "xl" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => onUpdate(id, { fontSize: s.value })}
                    className={`h-6 px-2 text-[10px] font-semibold rounded-md transition-all ${
                      (data.fontSize || "base") === s.value
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-background border border-border/70 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdate(id, { textAlign: "left" })}
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    (!data.textAlign || data.textAlign === "left") ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(id, { textAlign: "center" })}
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    data.textAlign === "center" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(id, { textAlign: "right" })}
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    data.textAlign === "right" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="h-3 w-3" />
                </button>
                <span className="h-3 w-px bg-border mx-0.5" />
                <button
                  type="button"
                  onClick={() => onUpdate(id, { fontStyle: data.fontStyle === "italic" ? "normal" : "italic" })}
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    data.fontStyle === "italic" ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground"
                  }`}
                  title="Italic"
                >
                  <Italic className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Emoji Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <Smile className="h-3.5 w-3.5" />
                <span>Icon Marker</span>
              </Label>
              {data.icon && (
                <button
                  onClick={() => onUpdate(id, { icon: "" })}
                  className="text-[10px] text-muted-foreground hover:text-primary"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl border border-border/60 bg-muted/20">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onUpdate(id, { icon: emoji })}
                  className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform ${
                    data.icon === emoji ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Color */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              <span>Branch Color</span>
            </Label>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onUpdate(id, { color: hex })}
                  className={`h-6 w-6 rounded-md border border-border/80 transition-transform ${
                    data.color === hex ? "scale-110 ring-2 ring-foreground" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Media (Original Image & Video Attachment) */}
        <TabsContent value="media" className="space-y-3.5 mt-0">
          {/* Active Media Preview */}
          {(data.imageUrl || data.videoUrl) && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {data.imageUrl ? <ImageIcon className="h-3.5 w-3.5 text-primary" /> : <Video className="h-3.5 w-3.5 text-primary" />}
                  {data.imageUrl ? "Original Attached Image" : "Attached Video"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(id, { imageUrl: null, videoUrl: null })}
                  className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>

              {/* Natural Image Preview (Original Aspect Ratio) */}
              {data.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.imageUrl}
                    alt="node media"
                    className="w-full h-auto object-contain max-h-48 block rounded-lg"
                  />
                </div>
              )}

              {/* Video Embed Player */}
              {data.videoUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-black/20">
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
                    <video src={data.videoUrl} controls className="w-full max-h-36 object-contain rounded-lg" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverUpload(true);
            }}
            onDragLeave={() => setDragOverUpload(false)}
            onDrop={onDropFile}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
              dragOverUpload
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UploadCloud className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isUploading ? "Uploading..." : "Upload Image or Video"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Image will display in its natural original aspect ratio
              </p>
            </div>
          </div>

          {/* Paste Embed Link */}
          <div className="space-y-1.5">
            <Label htmlFor="video-embed-url" className="text-[11px] text-muted-foreground font-semibold">
              Or Paste Image / Video URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="video-embed-url"
                placeholder="https://... image URL or YouTube link"
                value={data.videoUrl || data.imageUrl || ""}
                onChange={(e) => {
                  const url = e.target.value.trim();
                  if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) {
                    onUpdate(id, { videoUrl: url, imageUrl: null });
                  } else {
                    onUpdate(id, { imageUrl: url || null, videoUrl: null, customWidth: data.customWidth || 320 });
                  }
                }}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Reference Links */}
        <TabsContent value="links" className="space-y-3.5 mt-0">
          <div className="space-y-1.5">
            <Label htmlFor="link-url" className="text-[11px] text-muted-foreground font-semibold">
              Reference URL
            </Label>
            <Input
              id="link-url"
              placeholder="https://notion.so/spec-doc or https://github.com/..."
              value={data.linkUrl || ""}
              onChange={(e) => onUpdate(id, { linkUrl: e.target.value.trim() || null })}
              className="h-8.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-label" className="text-[11px] text-muted-foreground font-semibold">
              Chip Display Label
            </Label>
            <Input
              id="link-label"
              placeholder="e.g. Design Spec Document"
              value={data.linkLabel || ""}
              onChange={(e) => onUpdate(id, { linkLabel: e.target.value || null })}
              className="h-8.5 text-xs font-medium"
            />
          </div>

          {/* Test Link Button */}
          {data.linkUrl && (
            <div className="pt-1 flex items-center justify-between">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 text-primary"
              >
                <a href={data.linkUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Link</span>
                </a>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(id, { linkUrl: null, linkLabel: null })}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
              >
                Clear Link
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Metadata & Quick Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Direct Children:</span>
          <Badge variant="outline" className="text-[10px] h-4.5 px-1.5">
            {childCount} {childCount === 1 ? "node" : "nodes"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddChild(id)}
            className="h-8 text-xs font-semibold gap-1"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Child (Tab)
          </Button>

          {!isRoot && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(id)}
              className="h-8 text-xs font-semibold gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
