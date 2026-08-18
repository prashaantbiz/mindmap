"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleAuthButton } from "@/components/auth/social-auth-buttons";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error);
        toast.error("Login failed", { description: res.error });
      } else {
        toast.success("Welcome back!", { description: "Signing in to your workspace..." });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card/95 backdrop-blur-xs shadow-xl shadow-black/5 dark:shadow-black/40">
      <CardHeader className="space-y-1.5 pb-6">
        <div className="mx-auto mb-1 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Gmail Login Required</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Sign In to Workspace
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Continue with your Google account to access your mind maps and real-time canvas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google OAuth (Primary & Mandatory) */}
        <GoogleAuthButton />

        <div className="relative my-4 flex items-center justify-center">
          <Separator className="w-full" />
          <span className="absolute bg-card px-3 text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Or direct email credentials
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9.5 h-9.5 text-xs"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9.5 h-9.5 text-xs"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full h-10 font-semibold group text-xs"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                Sign In with Email
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform duration-150" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setEmail("demo@antigravity.io");
              setPassword("Password123!");
              setLoading(true);
              try {
                // Ensure demo account exists
                await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: "Demo Explorer",
                    email: "demo@antigravity.io",
                    password: "Password123!",
                  }),
                });

                const res = await signIn("credentials", {
                  redirect: false,
                  email: "demo@antigravity.io",
                  password: "Password123!",
                  callbackUrl,
                });

                if (!res?.error) {
                  toast.success("Welcome Demo User!");
                  router.push(callbackUrl);
                  router.refresh();
                }
              } catch (e) {
                toast.error("Demo login failed");
              } finally {
                setLoading(false);
              }
            }}
            className="w-full h-9 text-xs font-semibold border-dashed border-primary/50 text-primary hover:bg-primary/10"
            disabled={loading}
          >
            ⚡ Quick 1-Click Demo Login
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span>Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="ml-1.5 font-semibold text-primary hover:underline"
        >
          Create account
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </React.Suspense>
  );
}
