"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectGridCard, ProjectData } from "@/components/dashboard/project-grid-card";
import { ProjectListItem } from "@/components/dashboard/project-list-item";
import { TemplatePickerModal } from "@/components/dashboard/template-picker-modal";
import { RenameProjectModal } from "@/components/dashboard/rename-project-modal";
import { DeleteProjectModal } from "@/components/dashboard/delete-project-modal";
import { EmptyProjectsState } from "@/components/dashboard/empty-projects-state";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  Loader2,
  Folder,
  Network,
  Sparkles,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  // State
  const [projects, setProjects] = React.useState<ProjectData[]>([]);
  const [availableFolders, setAvailableFolders] = React.useState<string[]>(["Personal", "Work"]);
  const [stats, setStats] = React.useState({ total: 0, totalNodes: 0, archivedCount: 0 });
  const [loading, setLoading] = React.useState(true);

  // Filters & Controls
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFolder, setActiveFolder] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("recent");
  const [showArchived, setShowArchived] = React.useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [renameModalOpen, setRenameModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [targetProject, setTargetProject] = React.useState<ProjectData | null>(null);

  // Fetch projects from API
  const fetchProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeFolder !== "All" && activeFolder !== "Recent") params.set("folder", activeFolder);
      if (showArchived) params.set("archived", "true");
      params.set("sort", sortBy);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch mind maps");

      const data = await res.json();
      setProjects(data.projects || []);
      if (data.folders) setAvailableFolders(data.folders);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading projects:", err);
      toast.error("Failed to load mind maps");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFolder, showArchived, sortBy]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Actions
  const handleRename = (project: ProjectData) => {
    setTargetProject(project);
    setRenameModalOpen(true);
  };

  const handleDelete = (project: ProjectData) => {
    setTargetProject(project);
    setDeleteModalOpen(true);
  };

  const handleDuplicate = async (project: ProjectData) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Duplication failed");
      const data = await res.json();
      toast.success("Mind map duplicated!", {
        description: `Created "${data.project.title}".`,
      });
      fetchProjects();
    } catch (err) {
      toast.error("Failed to duplicate mind map.");
    }
  };

  const handleToggleArchive = async (project: ProjectData) => {
    try {
      const newArchived = !project.isArchived;
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: newArchived }),
      });
      if (!res.ok) throw new Error("Archive toggle failed");
      toast.success(newArchived ? "Mind map archived" : "Mind map restored to workspace");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to update archive status.");
    }
  };

  const sortLabels: Record<string, string> = {
    recent: "Recently Edited",
    alphabetical: "Title (A — Z)",
    created: "Date Created",
    nodes: "Node Count",
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Summary Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mind Maps
            </h1>
            <Badge variant="outline" className="text-xs h-5 px-2">
              {stats.total} {stats.total === 1 ? "map" : "maps"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create, structure, and link visual node trees and brainstorm boards.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="glow"
            className="h-10 px-4 font-semibold rounded-xl gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Mind Map</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Search, Folders/Tabs, Sort & View Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search Bar & Folder Pills */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mind maps..."
              className="pl-9 h-9 text-xs rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Folder Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={!showArchived && activeFolder === "All" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setShowArchived(false);
                setActiveFolder("All");
              }}
              className="h-8 text-xs font-medium rounded-lg px-3"
            >
              All Maps
            </Button>

            {availableFolders.map((f) => (
              <Button
                key={f}
                variant={!showArchived && activeFolder === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setShowArchived(false);
                  setActiveFolder(f);
                }}
                className="h-8 text-xs font-medium rounded-lg px-3 gap-1.5"
              >
                <Folder className="h-3 w-3 opacity-60" />
                {f}
              </Button>
            ))}

            <Button
              variant={showArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={`h-8 text-xs font-medium rounded-lg px-3 gap-1.5 ${
                showArchived ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Archive className="h-3 w-3" />
              <span>Archived ({stats.archivedCount})</span>
            </Button>
          </div>
        </div>

        {/* Right: Sort Dropdown & View Mode Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Sort Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-2 rounded-lg border-border/80"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline text-muted-foreground">Sort by:</span>
                <span className="font-medium">{sortLabels[sortBy]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="recent" className="cursor-pointer">
                  Recently Edited
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alphabetical" className="cursor-pointer">
                  Title (A — Z)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created" className="cursor-pointer">
                  Date Created
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nodes" className="cursor-pointer">
                  Node Count
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Grid / List View Toggle */}
          <div className="flex items-center p-1 rounded-lg border border-border/80 bg-muted/40">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <DashboardSkeleton count={8} />
      ) : projects.length === 0 ? (
        <EmptyProjectsState
          onOpenCreate={() => setCreateModalOpen(true)}
          isFiltered={Boolean(searchQuery || (activeFolder !== "All" && !showArchived))}
          onClearFilters={() => {
            setSearchQuery("");
            setActiveFolder("All");
            setShowArchived(false);
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((proj) => (
            <ProjectGridCard
              key={proj.id}
              project={proj}
              onRename={handleRename}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map((proj) => (
            <ProjectListItem
              key={proj.id}
              project={proj}
              onRename={handleRename}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TemplatePickerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onProjectCreated={fetchProjects}
        availableFolders={availableFolders}
      />

      <RenameProjectModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        project={targetProject}
        onRenamed={fetchProjects}
      />

      <DeleteProjectModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        project={targetProject}
        onDeleted={fetchProjects}
      />
    </div>
  );
}
