"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";
import { useLocale } from "next-intl";
import { translate } from "@/lib/translation";
import { getAccountNav } from "@/lib/nav";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { cn, getInitials } from "@/lib/utils";

interface UserNavProps {
  session: Session | null;
  onSignOut?: () => void;
}

export function UserNav({ session, onSignOut }: UserNavProps) {
  const localeFromHook = useLocale();
  const locale: Locale = isLocale(localeFromHook) ? localeFromHook : fallbackLocale;
  const navItems = getAccountNav(locale);
  const user = session?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 rounded-full border border-border px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
            <AvatarFallback>{getInitials(user?.name ?? "Ava")}</AvatarFallback>
          </Avatar>
          <div className="ml-2 hidden text-left lg:block">
            <p className="text-sm font-semibold leading-none">{user?.name ?? "Ava Operator"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? "ava@example.com"}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{user?.name ?? "Ava Operator"}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? "ava@example.com"}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {navItems.map((item) => (
            <DropdownMenuItem
              key={item.key}
              onSelect={item.key === "logout" ? onSignOut : undefined}
              className={cn(item.key === "logout" && "text-destructive")}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
