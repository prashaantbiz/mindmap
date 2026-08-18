import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Subtle background ambient gradient */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[450px] w-[550px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10 dark:blur-[140px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform duration-150">
            <Sparkles className="h-5 w-5 fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Nexus
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main Centered Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 Nexus Systems. Built with Next.js, Tailwind & NextAuth.</p>
      </footer>
    </div>
  );
}
