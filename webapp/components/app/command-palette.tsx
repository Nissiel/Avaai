"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { getPrimaryNav } from "@/lib/nav";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const storeOpen = useUIStore((state) => state.commandPaletteOpen);
  const setStoreOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? storeOpen ?? internalOpen;
  const localeHook = useLocale();
  const locale: Locale = isLocale(localeHook) ? localeHook : fallbackLocale;
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        const next = !open;
        setInternalOpen(next);
        setStoreOpen(next);
        onOpenChange?.(next);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange, setStoreOpen]);

  useEffect(() => {
    if (controlledOpen === undefined) return;
    setInternalOpen(controlledOpen);
  }, [controlledOpen]);

  useEffect(() => {
    setInternalOpen(storeOpen);
  }, [storeOpen]);

  const quickActions = useMemo(
    () => [
      {
        id: "new-test-call",
        label: translate(locale, "actions.newTestCall", "Launch test call"),
        href: "/app/calls/new",
      },
      {
        id: "new-contact",
        label: translate(locale, "actions.newContact", "Create contact"),
        href: "/app/contacts/new",
      },
      {
        id: "open-billing",
        label: translate(locale, "actions.openBilling", "Open billing"),
        href: "/app/billing",
      },
    ],
    [locale],
  );

  const navItems = getPrimaryNav(locale);

  const handleSelect = (href: string) => {
    setInternalOpen(false);
    setStoreOpen(false);
    onOpenChange?.(false);
    router.push(`/${locale}${href}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setInternalOpen(next);
        setStoreOpen(next);
        onOpenChange?.(next);
      }}
    >
      <DialogContent className="p-0 sm:max-w-lg">
        <Command>
          <CommandInput placeholder={translate(locale, "nav.command", "Search actions, contacts, or docs...")} />
          <CommandList>
            <CommandEmpty>{translate(locale, "nav.empty", "No results. Try another keyword.")}</CommandEmpty>
            <CommandGroup
              heading={translate(locale, "nav.goTo", "Go to")}
              className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              {navItems.map((item) => (
                <CommandItem key={item.key} value={item.key} onSelect={() => handleSelect(item.href)} className="gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup
              heading={translate(locale, "nav.quickActions", "Quick actions")}
              className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              {quickActions.map((action) => (
                <CommandItem key={action.id} value={action.id} onSelect={() => handleSelect(action.href)}>
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
