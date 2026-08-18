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
  Network,
  GitFork,
  Milestone,
  Server,
  ClipboardList,
  Check,
  Loader2,
  Folder,
} from "lucide-react";
import { toast } from "sonner";

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
  availableFolders: string[];
}

const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start fresh with a single central idea and add nodes freely.",
    nodeCount: 1,
    icon: Plus,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30",
  },
  {
    id: "brainstorm",
    name: "Brainstorming & Strategy",
    description: "4 structured branches for Strengths, Opportunities, Risks, and Goals.",
    nodeCount: 15,
    icon: Network,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "roadmap",
    name: "Product Roadmap",
    description: "Quarterly timeline nodes with milestone deliverables and branches.",
    nodeCount: 12,
    icon: Milestone,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "architecture",
    name: "System Architecture",
    description: "Diagram Frontend, API Gateway, Microservices, and Databases.",
    nodeCount: 8,
    icon: Server,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
  },
  {
    id: "meeting",
    name: "Meeting Notes & Actions",
    description: "Record Agenda, Discussion Points, Decisions, and Assigned Tasks.",
    nodeCount: 10,
    icon: ClipboardList,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
];

export function TemplatePickerModal({
  open,
  onOpenChange,
  onProjectCreated,
  availableFolders,
}: TemplatePickerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState("blank");
  const [title, setTitle] = React.useState("Untitled Mind Map");
  const [folder, setFolder] = React.useState("Personal");
  const [loading, setLoading] = React.useState(false);

  const handleSelectTemplate = (id: string, name: string) => {
    setSelectedTemplate(id);
    if (!title || title.startsWith("Untitled") || TEMPLATES.some((t) => t.name === title)) {
      setTitle(id === "blank" ? "Untitled Mind Map" : name);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
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
          template: selectedTemplate,
          folder: folder || "Personal",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to create mind map", { description: data.error });
        return;
      }

      toast.success("Mind map created!", {
        description: `Created "${data.project.title}" with ${data.project.nodeCount} starter nodes.`,
      });

      onOpenChange(false);
      onProjectCreated();
      setTitle("Untitled Mind Map");
      setSelectedTemplate("blank");
    } catch (err) {
      toast.error("An error occurred while creating the mind map.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Mind Map
          </DialogTitle>
          <DialogDescription>
            Choose a starting template or begin with a clean blank canvas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-6 pt-2">
          {/* Template Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Starter Template
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id, tmpl.name)}
                    className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs shadow-primary/20 ring-1 ring-primary"
                        : "border-border hover:border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`p-2 rounded-lg border ${tmpl.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {tmpl.nodeCount} {tmpl.nodeCount === 1 ? "node" : "nodes"}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {tmpl.name}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="map-title">Mind Map Title</Label>
              <Input
                id="map-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Growth Strategy"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="map-folder">Folder / Category</Label>
              <div className="relative">
                <Folder className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="map-folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="e.g. Personal, Work, Strategy"
                  className="pl-9.5"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="glow" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating canvas...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Mind Map
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
