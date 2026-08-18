"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  ExternalLink,
  ShieldCheck,
  Eye,
  MessageSquare,
  Edit,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export function ShareModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}: ShareModalProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isShared, setIsShared] = React.useState(false);
  const [accessLevel, setAccessLevel] = React.useState<"view" | "comment" | "edit">("view");
  const [shareToken, setShareToken] = React.useState<string | null>(null);
  const [hasCopied, setHasCopied] = React.useState(false);

  // Fetch current share status
  React.useEffect(() => {
    if (!isOpen) return;

    async function loadShareSettings() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/projects/${projectId}/share`);
        if (res.ok) {
          const data = await res.json();
          setIsShared(data.isShared);
          if (data.share) {
            setAccessLevel(data.share.accessLevel || "view");
            setShareToken(data.share.token);
          }
        }
      } catch (err) {
        console.error("Error loading share settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadShareSettings();
  }, [isOpen, projectId]);

  const handleToggleShare = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, accessLevel }),
      });

      if (!res.ok) throw new Error("Failed to update share settings");
      const data = await res.json();

      setIsShared(data.isShared);
      if (data.share) {
        setShareToken(data.share.token);
      } else {
        setShareToken(null);
      }

      toast.success(enabled ? "Public link enabled" : "Public link disabled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update share settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccessLevelChange = async (level: "view" | "comment" | "edit") => {
    setAccessLevel(level);
    if (!isShared) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, accessLevel: level }),
      });
      if (res.ok) {
        toast.success(`Permission updated to ${level === "view" ? "View only" : level === "comment" ? "Can comment" : "Can edit"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const shareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : "";

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card/95 backdrop-blur-md border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Share Mind Map
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {projectTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading share settings…</span>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Share Switch Banner */}
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isShared ? (
                  <Globe className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    {isShared ? "Public Link is Active" : "Private (Only You)"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {isShared
                      ? "Anyone with the link can view this mind map."
                      : "Only you can view and edit this mind map."}
                  </p>
                </div>
              </div>

              <Button
                variant={isShared ? "destructive" : "default"}
                size="sm"
                onClick={() => handleToggleShare(!isShared)}
                disabled={isSaving}
                className="h-8 text-xs font-semibold shrink-0"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                {isShared ? "Disable Link" : "Enable Link"}
              </Button>
            </div>

            {/* If Shared, show access level and copy link controls */}
            {isShared && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-150">
                {/* Access Level Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Access Level
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccessLevelChange("view")}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        accessLevel === "view"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>View Only</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Read-only map</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccessLevelChange("comment")}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        accessLevel === "comment"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Can Comment</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Inspect & note</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccessLevelChange("edit")}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        accessLevel === "edit"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <Edit className="h-3.5 w-3.5 text-amber-500" />
                        <span>Can Edit</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Co-editing</p>
                    </button>
                  </div>
                </div>

                {/* Link Field with Copy */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Shareable Link
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={shareUrl}
                      className="h-9 text-xs font-mono bg-muted/30"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Open View Launcher */}
                <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px]">Preview how non-logged in users see this:</span>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10 gap-1"
                  >
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <span>Open View</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
