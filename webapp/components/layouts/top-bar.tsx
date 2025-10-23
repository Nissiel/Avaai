"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MobileNav } from "@/components/ui/mobile-nav";
import { UserMenu } from "@/components/ui/user-menu";
import { sidebarNavItems } from "@/components/layouts/sidebar";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <MobileNav items={sidebarNavItems} />
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <Input
            autoFocus
            placeholder="Rechercher…"
            className="hidden w-64 rounded-full border-border/70 bg-muted/30 text-sm focus-visible:ring-1 md:block"
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Rechercher</span>
          </Button>
        )}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
