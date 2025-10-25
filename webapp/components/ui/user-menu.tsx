"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clearPersistedSession } from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";

function initials(name?: string | null): string {
  if (!name) return "AVA";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserMenu() {
  const { session, setSession } = useSessionStore((state) => ({
    session: state.session,
    setSession: state.setSession,
  }));
  const router = useRouter();
  const locale = useLocale();
  const tMenu = useTranslations("userMenu");
  const tAuth = useTranslations("auth");
  const displayName = session?.user?.name ?? session?.user?.email ?? tMenu("profile");
  const email = session?.user?.email ?? "";

  const handleSignOut = async () => {
    clearPersistedSession();
    setSession(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
      window.localStorage.removeItem("remember_me");
    }
    await signOut({ redirect: false });
    router.push(`/${locale}/login`.replace(/\/{2,}/g, "/"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full border border-border/60 px-2 py-1">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm font-medium leading-tight md:block">
            <span className="block text-foreground">{displayName}</span>
            {email ? <span className="block text-xs text-muted-foreground">{email}</span> : null}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="min-w-[220px]">
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {tMenu("signedInAs")}
        </DropdownMenuLabel>
        <div className="px-3 pb-2 text-sm">
          <p className="font-semibold text-foreground">{displayName}</p>
          {email ? <p className="text-muted-foreground">{email}</p> : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="gap-2 text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {tAuth("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
