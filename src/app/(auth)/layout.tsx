import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

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
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-sm group-hover:scale-105 transition-transform duration-150 flex-shrink-0 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="mindmap.prashaant.biz logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              mindmap.prashaant.biz
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Visual Ideation & Mind Mapping</span>
          </div>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main Centered Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 mindmap.prashaant.biz. All rights reserved.</p>
      </footer>
    </div>
  );
}
