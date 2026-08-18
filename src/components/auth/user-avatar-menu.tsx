"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, FolderKanban, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function UserAvatarMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return (
      <Button asChild size="sm" className="h-9 font-medium px-4">
        <a href="/login">Sign In</a>
      </Button>
    );
  }

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const defaultProject = (user as any)?.defaultProject;

  const handleSignOut = async () => {
    toast.info("Signing out...");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/40 focus:ring-primary transition-all duration-150 p-0"
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user.name || "Workspace Member"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        {defaultProject && (
          <div className="px-2 py-1.5 mb-1 bg-muted/60 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium">
              <FolderKanban className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-[130px]">{defaultProject.name}</span>
            </div>
            <Badge variant="accent" className="text-[10px] h-4.5 px-1.5 font-normal">
              Default
            </Badge>
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href="/settings">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile & Settings</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href="/">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span>Projects Dashboard</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
