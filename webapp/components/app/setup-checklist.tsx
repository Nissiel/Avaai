"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, X, ChevronRight, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupStatus } from "@/lib/hooks/use-setup-status";

interface ChecklistItem {
  id: string;
  labelKey: string;
  descriptionKey: string;
  completed: boolean;
  href: string;
}

export function SetupChecklist() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("setupChecklist");

  const {
    status,
    isLoading,
    isFetching,
    dismissed,
    mounted,
    dismiss,
    completedCount,
    isSetupActive,
  } = useSetupStatus();

  const handleItemClick = (href: string) => {
    router.push(href);
  };

  // Don't render if not active
  if (!isSetupActive) {
    return null;
  }

  const items: ChecklistItem[] = [
    {
      id: "profile",
      labelKey: "items.profile.label",
      descriptionKey: "items.profile.description",
      completed: status?.profile_completed ?? false,
      href: `/${locale}/settings?section=business`,
    },
    {
      id: "phone",
      labelKey: "items.phone.label",
      descriptionKey: "items.phone.description",
      completed: status?.phone_configured ?? false,
      href: `/${locale}/app/phone`,
    },
    {
      id: "assistant",
      labelKey: "items.assistant.label",
      descriptionKey: "items.assistant.description",
      completed: status?.assistant_created ?? false,
      href: `/${locale}/app/assistants`,
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isFetching ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Rocket className="h-4 w-4 text-primary" />
          )}
          <h3 className="text-sm font-medium">
            {t("title")} ({completedCount}/{items.length})
          </h3>
        </div>
        <button
          onClick={dismiss}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.href)}
            className="w-full flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-muted/50"
          >
            {/* Checkbox */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                item.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {item.completed && <Check className="h-3 w-3" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  item.completed ? "text-muted-foreground line-through" : ""
                }`}
              >
                {t(item.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t(item.descriptionKey)}
              </p>
            </div>

            {/* Arrow */}
            {!item.completed && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={dismiss}
          className="w-full text-xs text-muted-foreground"
        >
          {t("completeLater")}
        </Button>
      </div>
    </div>
  );
}
