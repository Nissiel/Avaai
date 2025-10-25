"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MobileNav } from "@/components/ui/mobile-nav";
import { UserMenu } from "@/components/ui/user-menu";
import { useSidebarNavItems } from "@/components/layouts/sidebar";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LocaleSwitcher } from "@/components/navigation/locale-switcher";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = useSidebarNavItems();
  const tNav = useTranslations("nav");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <MobileNav items={navItems} />
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <Input
            autoFocus
            placeholder={tNav("searchPlaceholder")}
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
            <span className="sr-only">{tNav("search")}</span>
          </Button>
        )}
        <LocaleSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
