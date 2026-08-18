"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import { ProjectData } from "./project-grid-card";
import {
  Network,
  MoreHorizontal,
  Edit3,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Clock,
  Folder,
} from "lucide-react";

interface ProjectListItemProps {
  project: ProjectData;
  onRename: (project: ProjectData) => void;
  onDelete: (project: ProjectData) => void;
  onDuplicate: (project: ProjectData) => void;
  onToggleArchive: (project: ProjectData) => void;
}

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProjectListItem({
  project,
  onRename,
  onDelete,
  onDuplicate,
  onToggleArchive,
}: ProjectListItemProps) {
  const router = useRouter();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          tabIndex={0}
          role="button"
          aria-label={`Open mind map: ${project.title}`}
          onClick={() => router.push(`/editor/${project.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/editor/${project.id}`);
            }
          }}
          className="group relative flex items-center justify-between p-3.5 sm:px-5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150 cursor-pointer"
        >
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <Network className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {project.title}
                </h4>
                {project.isDefault && (
                  <Badge variant="accent" className="text-[9px] h-4 px-1.5 shrink-0">
                    Default
                  </Badge>
                )}
                {project.isArchived && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                    Archived
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {project.folder && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Folder className="h-3 w-3" />
                    {project.folder}
                  </span>
                )}
                {project.description && (
                  <span className="hidden md:inline truncate max-w-xs text-[11px]">
                    — {project.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Metadata & Actions */}
          <div className="flex items-center gap-4 shrink-0 pl-4">
            {/* Node count */}
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] h-6 px-2">
              {project.nodeCount} {project.nodeCount === 1 ? "node" : "nodes"}
            </Badge>

            {/* Last edited */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground w-20">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(project.updatedAt)}</span>
            </div>

            {/* Action dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(project);
                  }}
                  className="cursor-pointer"
                >
                  <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(project);
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(project);
                  }}
                  className="cursor-pointer"
                >
                  {project.isArchived ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Unarchive</span>
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Archive</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Right-click Context Menu */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onRename(project)} className="cursor-pointer">
          <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(project)} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Duplicate</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleArchive(project)} className="cursor-pointer">
          {project.isArchived ? (
            <>
              <ArchiveRestore className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Unarchive</span>
            </>
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Archive</span>
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(project)}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
