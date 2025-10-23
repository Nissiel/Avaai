"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { useLocale } from "next-intl";

export interface OrgOption {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "business";
}

interface OrgSwitcherProps {
  organizations?: OrgOption[];
  activeOrgId?: string;
  onCreate?: () => void;
  onSwitch?: (orgId: string) => void;
}

const PLAN_LABEL: Record<OrgOption["plan"], string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export function OrgSwitcher({ organizations = [], activeOrgId, onCreate, onSwitch }: OrgSwitcherProps) {
  const localeFromHook = useLocale();
  const locale: Locale = isLocale(localeFromHook) ? localeFromHook : fallbackLocale;
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => organizations.filter((org) => org.name.toLowerCase().includes(search.toLowerCase())), [organizations, search]);
  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? organizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={translate(locale, "org.switch", "Switch organization")}
          className="flex items-center justify-between rounded-2xl px-3"
        >
          <div className="flex min-w-[120px] flex-col text-left">
            <span className="text-sm font-semibold leading-tight">{activeOrg?.name ?? translate(locale, "org.none", "Select workspace")}</span>
            <span className="text-xs text-muted-foreground">{activeOrg ? PLAN_LABEL[activeOrg.plan] : translate(locale, "org.plan", "Choose a plan")}</span>
          </div>
          <ChevronsUpDown className="ml-3 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <div className="p-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={translate(locale, "org.search", "Search organizations")}
            className="h-10"
          />
        </div>
        <ScrollArea className="max-h-64 px-3 pb-3">
          <DropdownMenuGroup>
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                {translate(locale, "org.empty", "No organization found")}
              </div>
            ) : (
              filtered.map((org) => (
                <DropdownMenuCheckboxItem
                  key={org.id}
                  checked={org.id === activeOrg?.id}
                  onSelect={(event) => {
                    event.preventDefault();
                    onSwitch?.(org.id);
                  }}
                  className="flex items-start gap-2 rounded-xl px-3 py-2"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{org.name}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{PLAN_LABEL[org.plan]}</span>
                  </span>
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{translate(locale, "org.actions", "Actions")}</span>
          <Button size="sm" variant="subtle" onClick={onCreate} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            {translate(locale, "org.create", "New org")}
          </Button>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
