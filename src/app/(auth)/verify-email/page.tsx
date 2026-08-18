"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, MailCheck, ArrowRight } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = React.useState(Boolean(token));
  const [error, setError] = React.useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Email verification failed.");
        } else {
          setVerifiedEmail(data.email || "your account");
        }
      } catch (err) {
        setError("Network error occurred during verification.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="border-border/80 bg-card/95 backdrop-blur-xs shadow-xl shadow-black/5 dark:shadow-black/40">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Email Verification
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {token ? "Verifying your email token..." : "Check your inbox for a confirmation email"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-center">
        {loading && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Validating token with server...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 rounded-xl border border-destructive/30 bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">Verification Failed</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && verifiedEmail && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 rounded-xl border border-primary/30 bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <p className="text-sm font-semibold text-foreground">Email Verified Successfully!</p>
            <p className="text-xs text-muted-foreground">
              Thank you for verifying <span className="font-medium text-foreground">{verifiedEmail}</span>.
            </p>
          </div>
        )}

        {!loading && !token && !verifiedEmail && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 rounded-xl border border-border bg-muted/40">
            <MailCheck className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-foreground">Verification Email Sent</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We&apos;ve sent a verification link to your email address. Click the link to activate all workspace features.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 pt-4">
        <Button asChild className="w-full h-11 font-semibold group">
          <Link href="/login">
            Continue to App
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyEmailForm />
    </React.Suspense>
  );
}
