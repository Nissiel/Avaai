"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { SidebarNavItem } from "@/components/layouts/sidebar";
import { NavLink } from "@/components/ui/nav-link";

interface MobileNavProps {
  items: SidebarNavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir la navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px]">
        <nav className="mt-8 grid gap-2">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.exact} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
