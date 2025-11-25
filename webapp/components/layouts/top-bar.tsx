"use client";

import { MobileNav } from "@/components/ui/mobile-nav";
import { UserMenu } from "@/components/ui/user-menu";
import { useSidebarNavItems } from "@/components/layouts/sidebar";
import { LocaleSwitcher } from "@/components/navigation/locale-switcher";

export function TopBar() {
  const { main, account } = useSidebarNavItems();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <MobileNav items={[...main, ...account]} />
      </div>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
