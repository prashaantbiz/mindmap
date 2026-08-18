"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatarMenu } from "@/components/auth/user-avatar-menu";
import { Badge } from "@/components/ui/badge";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex h-15 items-center justify-between px-4 sm:px-8">
        {/* Left: Brand Logo & Minimal links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-sm group-hover:scale-105 transition-transform duration-150 flex-shrink-0 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="mindmap.prashaant.biz logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                mindmap.prashaant.biz
              </span>
              <Badge variant="outline" className="text-[10px] font-medium h-4.5 px-1.5 border-border/80 text-primary">
                v1.0
              </Badge>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors duration-150"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </Link>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground/80">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>mindmap.prashaant.biz</span>
            </div>
          </nav>
        </div>

        {/* Right: Actions (Theme Toggle + User Avatar Menu) */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="h-4 w-px bg-border/80" />
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
}
