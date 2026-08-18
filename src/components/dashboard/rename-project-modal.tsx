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
import { Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RenameProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string } | null;
  onRenamed: () => void;
}

export function RenameProjectModal({
  open,
  onOpenChange,
  project,
  onRenamed,
}: RenameProjectModalProps) {
  const [title, setTitle] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (project) {
      setTitle(project.title);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !title.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) {
        toast.error("Failed to rename mind map");
        return;
      }

      toast.success("Mind map renamed", {
        description: `Updated title to "${title.trim()}"`,
      });

      onOpenChange(false);
      onRenamed();
    } catch (err) {
      toast.error("An error occurred while renaming.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Edit3 className="h-4.5 w-4.5 text-primary" />
            Rename Mind Map
          </DialogTitle>
          <DialogDescription>
            Enter a new title for this mind map project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="rename-title">Title</Label>
            <Input
              id="rename-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brainstorming session"
              required
              autoFocus
              disabled={loading}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
