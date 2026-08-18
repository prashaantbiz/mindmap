"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FONT_OPTIONS } from "@/lib/fonts";
import {
  Plus,
  Network,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Palette,
  LayoutGrid,
  GitBranch,
  Layers,
  Sparkles,
  Type,
  Check,
} from "lucide-react";

interface FloatingToolbarProps {
  onAddChild: () => void;
  onAddSibling: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  onAutoLayout: (mode: "radial" | "top-down") => void;
  onRecolorSelected: (color: string) => void;
  hasSelection: boolean;
  selectedCount: number;
  currentFont?: string;
  onUpdateFont?: (fontId: string) => void;
}

const PALETTE_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Slate", hex: "#64748b" },
];

export function FloatingToolbar({
  onAddChild,
  onAddSibling,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  onAutoLayout,
  onRecolorSelected,
  hasSelection,
  selectedCount,
  currentFont = "inter",
  onUpdateFont,
}: FloatingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Mind Map Editing Toolbar"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/10 dark:shadow-black/60 max-w-[calc(100vw-32px)] overflow-x-auto transition-all duration-150"
    >
      {/* Add Child Node */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddChild}
            aria-label="Add child node (Tab)"
            className="h-8.5 px-2.5 text-xs font-semibold gap-1 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl shrink-0"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Child (Tab)</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add Child Node to selected branch (Tab)</p>
        </TooltipContent>
      </Tooltip>

      {/* Add Sibling Node */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddSibling}
            aria-label="Add sibling node (Enter)"
            className="h-8.5 px-2.5 text-xs font-semibold gap-1 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl shrink-0"
          >
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Sibling (Enter)</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add Sibling Node at current level (Enter)</p>
        </TooltipContent>
      </Tooltip>

      <span className="h-4 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* Undo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo action (Ctrl+Z)"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Undo (Ctrl+Z / Cmd+Z)</p>
        </TooltipContent>
      </Tooltip>

      {/* Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo action (Ctrl+Y)"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Redo (Ctrl+Y / Cmd+Shift+Z)</p>
        </TooltipContent>
      </Tooltip>

      <span className="h-4 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* Font Picker Dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Font Typography selection"
                className="h-8.5 w-8.5 rounded-xl shrink-0 text-foreground"
              >
                <Type className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change Mind Map Font</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-52 p-1.5">
          <DropdownMenuLabel className="text-xs px-2 py-1">Typography Font</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {FONT_OPTIONS.map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={() => onUpdateFont?.(f.id)}
                className={`cursor-pointer text-xs flex items-center justify-between py-1.5 px-2 rounded-lg ${f.className} ${
                  currentFont === f.id ? "bg-primary/10 text-primary font-semibold" : ""
                }`}
              >
                <div>
                  <div className="text-xs">{f.name}</div>
                  <div className="text-[9px] text-muted-foreground">{f.category}</div>
                </div>
                {currentFont === f.id && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Auto-Layout Dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Auto Layout options"
                className="h-8.5 px-2.5 text-xs font-medium gap-1 rounded-xl shrink-0"
              >
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span className="hidden md:inline">Layout</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Auto-arrange nodes</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuLabel className="text-xs">Automatic Layouts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAutoLayout("radial")}
            className="cursor-pointer text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Radial Balance</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Default</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAutoLayout("top-down")}
            className="cursor-pointer text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Top-Down Tree</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Recolor Dropdown (if selection exists) */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Color Palette for branches"
                className="h-8.5 w-8.5 rounded-xl shrink-0"
              >
                <Palette className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change Branch Color {hasSelection ? `(${selectedCount} selected)` : ""}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-48 p-2">
          <DropdownMenuLabel className="text-xs">
            {hasSelection ? `Apply Color to ${selectedCount} Node(s)` : "Select a branch to color"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="grid grid-cols-4 gap-2 pt-1">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => onRecolorSelected(c.hex)}
                className="h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
                style={{ backgroundColor: c.hex }}
                title={c.name}
                aria-label={`Set color to ${c.name}`}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="h-4 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* Zoom Controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomOut}
            aria-label="Zoom Out"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom Out</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomIn}
            aria-label="Zoom In"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom In</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onFitView}
            aria-label="Zoom to Fit Canvas"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom to Fit Canvas</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onResetView}
            aria-label="Reset View to 100%"
            className="h-8.5 w-8.5 rounded-xl shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset View (100%)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
