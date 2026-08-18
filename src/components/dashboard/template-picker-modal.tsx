"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Check,
  Loader2,
  Folder,
  FolderPlus,
  ChevronDown,
  Layers,
  Cpu,
  Workflow,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { STARTER_TEMPLATES, StarterTemplate, getTemplateById } from "@/lib/templates";

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
  availableFolders: string[];
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  onProjectCreated,
  availableFolders = ["Personal", "Work"],
}: TemplatePickerModalProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("blank");
  const [title, setTitle] = React.useState("Untitled Mind Map");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [loading, setLoading] = React.useState(false);

  // Folder management state
  const [foldersList, setFoldersList] = React.useState<string[]>(availableFolders);
  const [selectedFolder, setSelectedFolder] = React.useState("Personal");
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = React.useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");

  // Sync available folders when prop changes
  React.useEffect(() => {
    const combined = Array.from(new Set(["Personal", "Work", ...availableFolders, ...foldersList]));
    setFoldersList(combined);
  }, [availableFolders]);

  const selectedTemplate = React.useMemo(() => {
    return getTemplateById(selectedTemplateId);
  }, [selectedTemplateId]);

  const categories = ["All", "Architecture & AI", "Product & Engineering", "Strategy & Planning", "Design & UX"];

  const filteredTemplates = React.useMemo(() => {
    if (activeCategory === "All") return STARTER_TEMPLATES;
    return STARTER_TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const handleSelectTemplate = (tmpl: StarterTemplate) => {
    setSelectedTemplateId(tmpl.id);
    if (!title || title.startsWith("Untitled") || STARTER_TEMPLATES.some((t) => t.name === title)) {
      setTitle(tmpl.id === "blank" ? "Untitled Mind Map" : tmpl.name);
    }
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (!clean) {
      toast.error("Please enter a folder name");
      return;
    }
    if (foldersList.includes(clean)) {
      setSelectedFolder(clean);
      setIsCreatingFolder(false);
      setNewFolderName("");
      setIsFolderDropdownOpen(false);
      return;
    }
    const updated = [...foldersList, clean];
    setFoldersList(updated);
    setSelectedFolder(clean);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setIsFolderDropdownOpen(false);
    toast.success(`Folder "${clean}" created & selected`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title for your mind map.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          template: selectedTemplateId,
          folder: selectedFolder || "Personal",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to create mind map", { description: data.error });
        return;
      }

      toast.success("Mind map created!", {
        description: `Opening "${data.project.title}" in ${selectedFolder}...`,
      });

      onOpenChange(false);
      onProjectCreated();
      setTitle("Untitled Mind Map");
      setSelectedTemplateId("blank");
      router.push(`/editor/${data.project.id}`);
    } catch (err) {
      toast.error("An error occurred while creating the mind map.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  Create New Mind Map
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select a high-tech starter architecture or start from a clean canvas.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono border-primary/30 text-primary bg-primary/5">
              High-Tech Architecture Engine
            </Badge>
          </div>
        </DialogHeader>

        {/* Modal Body: Two-Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Form Controls: Title & Folder Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border/70 bg-muted/30">
            {/* Title Input */}
            <div className="space-y-1.5">
              <Label htmlFor="map-title" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Mind Map Title</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="map-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Cloud Architecture"
                required
                disabled={loading}
                className="bg-background/80 h-9.5 text-sm"
              />
            </div>

            {/* Folder / Category Dropdown with "+ Create New Folder" */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Folder / Category</span>
                <span className="text-[10px] text-muted-foreground font-normal">Saved destination</span>
              </Label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFolderDropdownOpen(!isFolderDropdownOpen);
                    setIsCreatingFolder(false);
                  }}
                  className="w-full h-9.5 px-3 rounded-lg border border-input bg-background/80 hover:bg-background hover:border-primary/50 text-left flex items-center justify-between text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate">{selectedFolder}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isFolderDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isFolderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md shadow-xl p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95">
                    {!isCreatingFolder ? (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                          Select Destination Folder
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                          {foldersList.map((f) => {
                            const isSelected = selectedFolder === f;
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => {
                                  setSelectedFolder(f);
                                  setIsFolderDropdownOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-foreground hover:bg-muted/70 font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Folder className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                  <span className="truncate">{f}</span>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-1 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() => setIsCreatingFolder(true)}
                            className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-2 transition-colors"
                          >
                            <FolderPlus className="h-4 w-4 shrink-0" />
                            <span>+ Create New Folder...</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 space-y-2">
                        <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <FolderPlus className="h-3.5 w-3.5 text-primary" />
                          <span>New Folder Name</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Input
                            size={1}
                            autoFocus
                            placeholder="e.g. Q3 Engineering"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateNewFolder(e);
                              }
                            }}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateNewFolder}
                            className="h-8 px-2.5 text-xs font-semibold"
                          >
                            Create
                          </Button>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsCreatingFolder(false)}
                            className="text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Starter Template
              </Label>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-Panel: Template Grid (Left) + Interactive Visual Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Template Cards List */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredTemplates.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between group ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs shadow-primary/10"
                          : "border-border/80 bg-card/60 hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tmpl.rootNode.icon}</span>
                          <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {tmpl.name}
                          </h4>
                        </div>
                        <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${tmpl.color}`}>
                          {tmpl.nodeCount} {tmpl.nodeCount === 1 ? "node" : "nodes"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      {tmpl.branches.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/40 overflow-hidden">
                          {tmpl.branches.slice(0, 3).map((b, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono truncate"
                            >
                              {b.text.split(" ")[0]}
                            </span>
                          ))}
                          {tmpl.branches.length > 3 && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              +{tmpl.branches.length - 3}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Interactive Visual Preview Panel (Right) */}
              <div className="lg:col-span-6 rounded-xl border border-border/80 bg-background/90 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner">
                {/* Visual Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Eye className="h-4 w-4 text-primary" />
                    <span>Visual Topology Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedTemplate.category}
                  </span>
                </div>

                {/* SVG Visual Graph Representation */}
                <div className="flex-1 min-h-[220px] rounded-lg bg-dot-grid border border-border/40 relative flex items-center justify-center p-3 overflow-hidden">
                  {selectedTemplate.id === "blank" ? (
                    <div className="text-center space-y-2 animate-in fade-in-50">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto text-xl shadow-lg shadow-primary/10">
                        💡
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {title.trim() || "Central Idea"}
                      </div>
                      <div className="text-[11px] text-muted-foreground max-w-[200px] mx-auto">
                        A single root node ready for your arms, siblings, and branches.
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative scale-95 sm:scale-100 transition-all">
                      {/* Central Node Badge */}
                      <div
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md z-10 flex items-center gap-1.5 border border-white/20"
                        style={{ backgroundColor: selectedTemplate.accentHex }}
                      >
                        <span>{selectedTemplate.rootNode.icon}</span>
                        <span className="truncate max-w-[150px]">
                          {title.trim() && !title.startsWith("Untitled")
                            ? title.trim()
                            : selectedTemplate.previewTree.root}
                        </span>
                      </div>

                      {/* 4 Connected Branches Preview */}
                      <div className="w-full grid grid-cols-2 gap-x-6 gap-y-3 mt-4 z-10">
                        {selectedTemplate.previewTree.branches.map((branch, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2 rounded-lg bg-card/90 border border-border/80 shadow-xs space-y-1"
                            style={{ borderLeftColor: branch.color, borderLeftWidth: "3px" }}
                          >
                            <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                              <span className="truncate">{branch.name}</span>
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: branch.color }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {branch.subtopics.slice(0, 2).map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[9px] px-1 py-0.2 rounded bg-muted/60 text-muted-foreground truncate max-w-[90px]"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Organic Connector Lines (SVG Backdrop) */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                        <line x1="50%" y1="35%" x2="25%" y2="70%" stroke={selectedTemplate.accentHex} strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="50%" y1="35%" x2="75%" y2="70%" stroke={selectedTemplate.accentHex} strokeWidth="1.5" strokeDasharray="3 3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Template Summary Footer */}
                <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{selectedTemplate.name}</span>
                    <span>•</span>
                    <span>{selectedTemplate.nodeCount} Initial Nodes</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary font-medium">
                    Folder: {selectedFolder}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <Workflow className="h-3.5 w-3.5 text-primary" />
            <span>Ready to generate interactive high-tech hierarchy.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="glow"
              onClick={handleCreateProject}
              disabled={loading}
              className="font-bold text-xs shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Generating Map...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create Mind Map
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
