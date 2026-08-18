"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatarMenu } from "@/components/auth/user-avatar-menu";
import { ExportDropdown } from "./export-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Sparkles,
  CloudCheck,
  CloudUpload,
  CheckCircle2,
  MapPin,
  Map,
  Layers,
  Edit2,
  Share2,
  Type,
  Check,
} from "lucide-react";

interface EditorTopNavProps {
  project: {
    id: string;
    title: string;
    folder?: string | null;
    description?: string | null;
  } | null;
  nodeCount: number;
  saveStatus: "saved" | "saving" | "unsaved";
  lastSavedAt?: Date | null;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onUpdateTitle?: (title: string) => void;
  onOpenShare: () => void;
  nodes: any[];
  edges: any[];
  currentFont?: string;
  onUpdateFont?: (fontId: string) => void;
}

export function EditorTopNav({
  project,
  nodeCount,
  saveStatus,
  lastSavedAt,
  showMinimap,
  onToggleMinimap,
  onUpdateTitle,
  onOpenShare,
  nodes,
  edges,
  currentFont = "inter",
  onUpdateFont,
}: EditorTopNavProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleText, setTitleText] = React.useState(project?.title || "Mind Map");

  React.useEffect(() => {
    if (project?.title) {
      setTitleText(project.title);
    }
  }, [project?.title]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && onUpdateTitle && titleText !== project?.title) {
      onUpdateTitle(titleText.trim());
    }
  };

  const selectedFontObj = FONT_OPTIONS.find((f) => f.id === currentFont) || FONT_OPTIONS[0];

  return (
    <header className="absolute top-0 left-0 right-0 z-40 h-14 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Back Link & Editable Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8.5 px-2.5 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </Link>
        </Button>

        <span className="h-4 w-px bg-border/80" />

        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="bg-card border border-primary rounded-md px-2 py-0.5 text-xs font-bold text-foreground focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors truncate max-w-[180px] sm:max-w-xs"
              title="Click to rename"
            >
              <span className="truncate">{project?.title || "Untitled Mind Map"}</span>
              <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
            </button>
          )}

          {project?.folder && (
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] h-4.5 px-1.5">
              {project.folder}
            </Badge>
          )}
        </div>
      </div>

      {/* Center: Live Autosave Status Indicator */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/60 border border-border/70 text-[11px] shadow-xs">
          {saveStatus === "saving" ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-500 font-medium">Saving…</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">
                Saved {lastSavedAt ? `at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "to Cloud"}
              </span>
            </>
          )}
        </div>

        <Badge variant="secondary" className="text-[10px] h-5 px-2">
          {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
        </Badge>
      </div>

      {/* Right: Font Picker, Export, Share, Minimap, Theme & User Menu */}
      <div className="flex items-center gap-2">
        {/* Global Font Selector Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-2.5 rounded-lg text-xs font-semibold gap-1.5 border-border/80 bg-card hover:bg-muted"
                >
                  <Type className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden md:inline">{selectedFontObj.name}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change Mind Map Typography Font</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuLabel className="text-xs px-2 py-1.5">Mind Map Font</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {FONT_OPTIONS.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => onUpdateFont?.(f.id)}
                  className={`cursor-pointer text-xs flex items-center justify-between py-2 px-2.5 rounded-lg ${f.className} ${
                    currentFont === f.id ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{f.category}</div>
                  </div>
                  {currentFont === f.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Dropdown */}
        <ExportDropdown
          projectTitle={project?.title || "Mind Map"}
          project={project}
          nodes={nodes}
          edges={edges}
        />

        {/* Share Button */}
        <Button
          onClick={onOpenShare}
          size="sm"
          className="h-8.5 px-3 rounded-lg text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </Button>

        <span className="h-4 w-px bg-border/80 hidden sm:inline" />

        <Button
          variant={showMinimap ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleMinimap}
          className="h-8.5 px-2.5 rounded-lg text-xs font-medium gap-1.5 hidden sm:inline-flex"
          title="Toggle Minimap"
        >
          <Map className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Minimap</span>
        </Button>

        <span className="h-4 w-px bg-border/80" />

        <ThemeToggle />

        <span className="h-4 w-px bg-border/80" />

        <UserAvatarMenu />
      </div>
    </header>
  );
}
