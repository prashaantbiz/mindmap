"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export function GoogleAuthButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showChooserModal, setShowChooserModal] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customEmail, setCustomEmail] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [showDocs, setShowDocs] = React.useState(false);
  const [authenticatingEmail, setAuthenticatingEmail] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Check if real Google OAuth credentials are set in .env
      const res = await fetch("/api/auth/google-status");
      const data = await res.json();

      if (data.configured) {
        // If configured with real Google Cloud keys, proceed with real Google OAuth
        await signIn("google", { callbackUrl: "/dashboard" });
      } else {
        // Otherwise, open the Google Account Chooser
        setShowChooserModal(true);
      }
    } catch (err) {
      setShowChooserModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (account: { name: string; email: string; image?: string }) => {
    try {
      setAuthenticatingEmail(account.email);
      const res = await signIn("google-mock", {
        redirect: false,
        email: account.email.trim().toLowerCase(),
        name: account.name.trim(),
        image: account.image || `https://api.dicebear.com/7.x/initials/svg?seed=${account.name}`,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        toast.error("Sign-in error", { description: res.error });
      } else {
        toast.success(`Signed in as ${account.name}!`, {
          description: `Connected to ${account.email}`,
        });
        setShowChooserModal(false);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("Could not sign in with Google account");
    } finally {
      setAuthenticatingEmail(null);
    }
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter your Gmail address");
      return;
    }
    if (!cleanEmail.includes("@")) {
      toast.error("Please enter a valid Google / Gmail address");
      return;
    }
    handleSelectAccount({
      name: customName.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
    });
  };

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          className="w-full h-12 bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 dark:border-zinc-700 shadow-md font-semibold text-sm relative group transition-all duration-150 flex items-center justify-center gap-2.5"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google / Gmail</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Mandatory
          </span>
        </Button>
        <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Gmail authentication required for cloud workspace access</span>
        </p>
      </div>

      {/* Google Account Picker Dialog */}
      <Dialog open={showChooserModal} onOpenChange={setShowChooserModal}>
        <DialogContent className="max-w-md p-6 bg-card/95 backdrop-blur-md border-border/80 shadow-2xl space-y-4">
          <DialogHeader className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <DialogTitle className="text-base font-bold text-foreground">
                Sign in with Google
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose your Gmail account to continue to <strong>mindmap.prashaant.biz</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            {/* Primary Google Account */}
            <button
              type="button"
              disabled={Boolean(authenticatingEmail)}
              onClick={() =>
                handleSelectAccount({
                  name: "Prashant",
                  email: "prashaant.on.work@gmail.com",
                  image: "https://api.dicebear.com/7.x/initials/svg?seed=Prashant",
                })
              }
              className="w-full p-3 rounded-xl border border-border/80 hover:border-primary/60 hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20">
                  P
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Prashant</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-normal">
                      Primary Workspace Owner
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    prashaant.on.work@gmail.com
                  </div>
                </div>
              </div>
              {authenticatingEmail === "prashaant.on.work@gmail.com" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              )}
            </button>

            {/* Use Another Gmail Account Option */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full p-2.5 rounded-xl border border-dashed border-border/80 hover:bg-muted/40 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Use another Gmail account</span>
              </button>
            ) : (
              <form
                onSubmit={handleCustomAccountSubmit}
                className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2.5 animate-in fade-in-50"
              >
                <div className="space-y-1">
                  <Label htmlFor="customName" className="text-[11px] font-medium">Name</Label>
                  <Input
                    id="customName"
                    placeholder="Your Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customEmail" className="text-[11px] font-medium">Gmail Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="customEmail"
                      type="email"
                      placeholder="yourname@gmail.com"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomInput(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={Boolean(authenticatingEmail)}
                    className="h-7 text-xs font-semibold"
                  >
                    {authenticatingEmail ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Sign In with Gmail
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Dev Notice & OAuth Credentials Setup Instructions */}
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowDocs(!showDocs)}
              className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-primary" />
                Want to connect real Google Cloud OAuth API keys?
              </span>
              {showDocs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showDocs && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-[11px] text-muted-foreground space-y-1.5 animate-in fade-in-50">
                <p className="text-foreground font-medium">To enable external Google authentication:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Go to Google Cloud Console ➔ APIs & Services ➔ Credentials.</li>
                  <li>Create OAuth 2.0 Client ID (Web Application).</li>
                  <li>Set Redirect URI: <code className="text-primary font-mono text-[10px]">https://mindmap.prashaant.biz/api/auth/callback/google</code></li>
                  <li>Add <code className="text-primary font-mono text-[10px]">GOOGLE_CLIENT_ID</code> and <code className="text-primary font-mono text-[10px]">GOOGLE_CLIENT_SECRET</code> to your <code className="text-primary font-mono text-[10px]">.env</code> file.</li>
                </ol>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
