"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { ProjectThumbnailPreview } from "./project-thumbnail-preview";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Edit3,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Clock,
  Folder,
  Tag,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export interface ProjectData {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  nodeCount: number;
  folder?: string | null;
  tags: string[];
  isArchived: boolean;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ProjectGridCardProps {
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

export function ProjectGridCard({
  project,
  onRename,
  onDelete,
  onDuplicate,
  onToggleArchive,
}: ProjectGridCardProps) {
  const router = useRouter();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
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
          className="group relative overflow-hidden border-border/80 bg-card hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 flex flex-col justify-between cursor-pointer"
        >
          {/* Thumbnail Graphic Preview */}
          <div className="relative">
            <ProjectThumbnailPreview
              title={project.title}
              nodeCount={project.nodeCount}
              folder={project.folder}
            />

            {/* Quick action trigger button on hover */}
            <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-background/90 backdrop-blur-xs border border-border/70 shadow-xs hover:bg-card"
                  >
                    <MoreVertical className="h-4 w-4" />
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

          {/* Card Body Information */}
          <CardContent className="p-4 space-y-2 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              {project.isArchived && (
                <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 shrink-0">
                  Archived
                </Badge>
              )}
            </div>

            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {project.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{project.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>

          {/* Card Footer Metadata */}
          <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/40 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(project.updatedAt)}</span>
            </div>
            {project.isDefault && (
              <Badge variant="accent" className="text-[9px] h-4 px-1.5">
                Default
              </Badge>
            )}
          </CardFooter>
        </Card>
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
