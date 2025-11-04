import type { TwilioLinkResult } from "@/lib/dto/assistants";

type Translator = (key: string, values?: Record<string, string | number | undefined>) => string;

export type TwilioToastVariant = "success" | "info" | "error";

export interface TwilioLinkToast {
  variant: TwilioToastVariant;
  title: string;
  description: string;
}

/**
 * Map backend Twilio auto-link statuses to human friendly toast content.
 */
export function getTwilioLinkToast(
  t: Translator,
  link?: TwilioLinkResult | null,
): TwilioLinkToast | null {
  if (!link || !link.status) {
    return null;
  }

  const titleMap: Record<TwilioToastVariant, string> = {
    success: t("twilio.link.title.ready"),
    info: t("twilio.link.title.action"),
    error: t("twilio.link.title.error"),
  };

  const number = link.number ?? link.phoneId ?? t("twilio.link.unknownNumber");

  switch (link.status) {
    case "imported":
      return {
        variant: "success",
        title: titleMap.success,
        description: t("twilio.link.imported", { number }),
      };
    case "assigned_existing":
      return {
        variant: "success",
        title: titleMap.success,
        description: t("twilio.link.assigned", { number }),
      };
    case "already_linked":
      return {
        variant: "info",
        title: titleMap.success,
        description: t("twilio.link.alreadyLinked"),
      };
    case "linked_elsewhere":
      return {
        variant: "info",
        title: titleMap.info,
        description: t("twilio.link.linkedElsewhere"),
      };
    case "assignment_failed":
      return {
        variant: "info",
        title: titleMap.info,
        description: t("twilio.link.assignmentFailed"),
      };
    case "vapi_key_missing":
      return {
        variant: "info",
        title: titleMap.info,
        description: t("twilio.link.missingVapi"),
      };
    case "import_failed":
      return {
        variant: "error",
        title: titleMap.error,
        description: t("twilio.link.importFailed"),
      };
    default:
      return null;
  }
}
