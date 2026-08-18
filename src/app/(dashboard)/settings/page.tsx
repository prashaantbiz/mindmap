"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Sun,
  Moon,
  Laptop,
  Download,
  Trash2,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  ShieldAlert,
  FolderKanban,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  const [name, setName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [stats, setStats] = React.useState<{ projectsCount: number } | null>(null);

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial profile
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setName(data.user.name || "");
            setAvatarUrl(data.user.image || "");
            setStats({ projectsCount: data.user.projectsCount });
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: avatarUrl.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();

      await updateSession({ name: data.user.name, image: data.user.image });
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Could not update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportAllData = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing complete workspace backup...");
      const res = await fetch("/api/user/export");
      if (!res.ok) throw new Error("Failed to export data");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `antigravity_mindmaps_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Workspace backup downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    try {
      setIsDeletingAccount(true);
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");

      toast.success("Your account has been deleted");
      await signOut({ callbackUrl: "/signup" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account");
      setIsDeletingAccount(false);
    }
  };

  const initials = (name || session?.user?.name || session?.user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-border/80"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Account & Workspace Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your personal profile, appearance theme, and data backups.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Profile Details</CardTitle>
                <CardDescription className="text-xs">
                  Your identity across projects and shared mind maps.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border/80 shadow-md">
                  <AvatarImage src={avatarUrl || session?.user?.image || ""} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="avatarUrl" className="text-xs font-semibold">Avatar Image URL</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/my-photo.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Paste an image link or leave empty to use your monogram initials.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                    <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/5 gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Verified</span>
                    </Badge>
                  </div>
                  <Input
                    id="email"
                    value={session?.user?.email || ""}
                    disabled
                    readOnly
                    className="h-9 text-xs bg-muted/40 text-muted-foreground font-mono"
                  />
                </div>
              </div>

              {stats && (
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    <span>Total Mind Maps Owned</span>
                  </div>
                  <Badge variant="secondary" className="font-bold text-xs">
                    {stats.projectsCount} {stats.projectsCount === 1 ? "project" : "projects"}
                  </Badge>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="h-9 px-4 text-xs font-semibold gap-1.5"
                >
                  {isSavingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme & Appearance Card */}
        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Theme & Appearance</CardTitle>
                <CardDescription className="text-xs">
                  Choose your preferred canvas and workspace color theme.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Light Mode */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    theme === "light"
                      ? "border-primary bg-primary/10 ring-2 ring-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Sun className="h-4 w-4" />
                    </div>
                    {theme === "light" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Light Mode</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Clean, bright off-white workspace
                  </p>
                </button>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    theme === "dark"
                      ? "border-primary bg-primary/10 ring-2 ring-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Moon className="h-4 w-4" />
                    </div>
                    {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Dark Mode</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Deep charcoal with subtle neon glow
                  </p>
                </button>

                {/* System Mode */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    theme === "system"
                      ? "border-primary bg-primary/10 ring-2 ring-primary shadow-sm"
                      : "border-border/70 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                      <Laptop className="h-4 w-4" />
                    </div>
                    {theme === "system" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <h4 className="text-xs font-bold text-foreground">System Match</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Syncs with your OS display mode
                  </p>
                </button>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Backup Card */}
        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Data & Backup</CardTitle>
                <CardDescription className="text-xs">
                  Export all your mind map projects, attachments, and graphs as structured JSON.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-foreground">Complete Workspace Export</h4>
              <p className="text-xs text-muted-foreground">
                Download a single JSON package containing all your projects, node structures, and settings.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportAllData}
              disabled={isExporting}
              className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0 border-border/80"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Download className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Export All Data (JSON)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone: Delete Account */}
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-xs">
                  Irreversible actions for your account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-foreground">Delete Account and All Mind Maps</h4>
              <p className="text-xs text-muted-foreground">
                Permanently removes your account, all projects, nodes, attachments, and share tokens.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Account</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-card/95 backdrop-blur-md border-destructive/40 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Delete Account Permanently?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action <strong>cannot be undone</strong>. All your mind maps, nodes, files, and share links will be permanently wiped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="deleteConfirm" className="text-xs font-semibold">
              Type <span className="text-destructive font-mono font-bold">DELETE</span> to confirm:
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="h-9 text-xs font-mono"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingAccount}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmationInput !== "DELETE" || isDeletingAccount}
              className="text-xs font-semibold gap-1.5"
            >
              {isDeletingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Permanently Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
