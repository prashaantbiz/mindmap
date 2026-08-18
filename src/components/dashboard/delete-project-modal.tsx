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
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string } | null;
  onDeleted: () => void;
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  project,
  onDeleted,
}: DeleteProjectModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete mind map");
        return;
      }

      toast.success("Mind map deleted", {
        description: `Permanently removed "${project.title}".`,
      });

      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error("An error occurred while deleting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            Delete Mind Map?
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{project?.title}&quot;</span>? This action cannot be undone and will permanently remove all connected nodes.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
