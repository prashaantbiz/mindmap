"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleAuthButton } from "@/components/auth/social-auth-buttons";
import { Loader2, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = React.useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificationNotice(null);

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        toast.error("Registration failed", { description: data.error });
        return;
      }

      toast.success("Account created!", {
        description: "Your default workspace was provisioned automatically.",
      });

      // Automatically sign in the user
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: "/dashboard",
      });

      if (!loginRes?.error) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setVerificationNotice("Account created successfully! You can now log in.");
      }
    } catch (err: any) {
      setError("Network error occurred during signup.");
      toast.error("Signup error");
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
          Create Workspace Account
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Get started with your provisioned workspace and cloud sync
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google OAuth (Primary & Mandatory) */}
        <GoogleAuthButton />

        <div className="relative my-4 flex items-center justify-center">
          <Separator className="w-full" />
          <span className="absolute bg-card px-3 text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Or register with direct email
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {verificationNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>{verificationNotice}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9.5 h-9.5 text-xs"
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

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
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9.5 h-9.5 text-xs"
                required
                autoComplete="new-password"
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
                Creating account...
              </>
            ) : (
              <>
                Create Account with Email
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform duration-150" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span>Already have an account?</span>
        <Link
          href="/login"
          className="ml-1.5 font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
