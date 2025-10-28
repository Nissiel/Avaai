"use client";

import { Menu, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";
import { MainNav } from "@/components/navigation/main-nav";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { UserNav } from "@/components/navigation/user-nav";
import { OrgSwitcher, type OrgOption } from "@/components/navigation/org-switcher";
import { CommandPalette } from "@/components/app/command-palette";
import { useUIStore } from "@/stores/ui-store";
import { useSessionStore } from "@/stores/session-store";

interface AppShellProps {
  children: React.ReactNode;
  organizations?: OrgOption[];
  activeOrgId?: string;
  onCreateOrg?: () => void;
  onSwitchOrg?: (orgId: string) => void;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function AppShell({
  children,
  organizations = [],
  activeOrgId,
  onCreateOrg,
  onSwitchOrg,
  headerContent,
  footerContent,
}: AppShellProps) {
  const localeHook = useLocale();
  const locale: Locale = isLocale(localeHook) ? localeHook : fallbackLocale;
  const [isNavOpen, setIsNavOpen] = useState(false);
  const session = useSessionStore((state) => state.session);
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  const activeOrg = useMemo(
    () => organizations.find((org) => org.id === activeOrgId) ?? organizations[0],
    [organizations, activeOrgId],
  );

  const handleSwitch = useCallback(
    (orgId: string) => {
      onSwitchOrg?.(orgId);
      setIsNavOpen(false);
    },
    [onSwitchOrg],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-screen-2xl items-center gap-3 px-4">
          <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{translate(locale, "nav.menu", "Open navigation")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <ScrollArea className="h-full p-4">
                <OrgSwitcher
                  organizations={organizations}
                  activeOrgId={activeOrg?.id}
                  onCreate={onCreateOrg}
                  onSwitch={handleSwitch}
                />
                <div className="mt-6">
                  <MainNav />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="hidden lg:flex">
            <OrgSwitcher
              organizations={organizations}
              activeOrgId={activeOrg?.id}
              onCreate={onCreateOrg}
              onSwitch={onSwitchOrg}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-2xl border border-border px-3 text-sm text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span>{translate(locale, "nav.search", "Search")}</span>
              <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline">
                ⌘K
              </span>
            </Button>
            <div className="hidden min-w-[280px] items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 lg:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                onFocus={() => setCommandPaletteOpen(true)}
                readOnly
                className="h-8 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                placeholder={translate(locale, "nav.searchPlaceholder", "Search actions, contacts, calls...")}
                aria-label={translate(locale, "nav.searchPlaceholder", "Search actions, contacts, calls...")}
              />
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                ⌘K
              </span>
            </div>
            <ThemeToggle />
            <UserNav session={session ?? null} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-8 px-4 py-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <MainNav />
        </aside>
        <main className="flex w-full flex-1 flex-col gap-6">
          {headerContent}
          <div className="flex-1 space-y-6">{children}</div>
          {footerContent ? <footer className="py-8 text-sm text-muted-foreground">{footerContent}</footer> : null}
        </main>
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  );
}
