import { TopNav } from "@/components/layout/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <TopNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 mindmap.prashaant.biz. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              mindmap.prashaant.biz
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
