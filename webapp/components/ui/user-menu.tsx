"use client";

import { LogOut } from "lucide-react";
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
import { clearAllAuthData, broadcastLogout } from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";
import { supabaseAuthEnabled } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

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
  const locale = useLocale();
  const tMenu = useTranslations("userMenu");
  const tAuth = useTranslations("auth");
  const displayName = session?.user?.name ?? session?.user?.email ?? tMenu("profile");
  const email = session?.user?.email ?? "";

  const handleSignOut = async () => {
    try {
      // 1. Sign out from Supabase (invalidates session on server)
      if (supabaseAuthEnabled()) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }

      // 2. Call backend logout to clear HTTP-only cookies
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (e) {
        console.warn("Backend logout failed:", e);
      }

      // 3. Clear all local auth data (localStorage + client cookies)
      clearAllAuthData();
      setSession(null);

      // 4. Broadcast logout to other tabs
      broadcastLogout();

      // 5. Force redirect to login page
      const loginUrl = `/${locale}/login`.replace(/\/{2,}/g, "/");
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, force redirect to login
      clearAllAuthData();
      const loginUrl = `/${locale}/login`.replace(/\/{2,}/g, "/");
      window.location.href = loginUrl;
    }
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
