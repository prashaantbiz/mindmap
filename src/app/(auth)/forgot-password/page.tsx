"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetToken(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process password reset.");
        return;
      }

      toast.success("Reset link created", {
        description: "Password reset token generated.",
      });

      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card/95 backdrop-blur-xs shadow-xl shadow-black/5 dark:shadow-black/40">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center text-sm">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetToken ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Reset Token Generated</span>
              </div>
              <p className="text-xs text-muted-foreground">
                In production, this link is emailed securely. In development, click below to proceed directly:
              </p>
            </div>

            <Button asChild className="w-full h-11 font-semibold group">
              <Link href={`/reset-password?token=${resetToken}`}>
                Continue to Reset Password
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9.5"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
