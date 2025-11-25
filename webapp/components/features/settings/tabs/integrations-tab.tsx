"use client";

import { useTranslations } from "next-intl";
import {
  Calendar,
  MessageCircle,
  Building2,
} from "lucide-react";

import { IntegrationCard, type IntegrationStatus } from "@/components/ui/integration-card";

type IntegrationType = "calendar" | "whatsapp" | "crm";

interface Integration {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  available: boolean;
}

export function IntegrationsTab() {
  const t = useTranslations("settingsPage.integrations");

  const integrations: Integration[] = [
    {
      id: "calendar",
      name: t("calendar.name"),
      description: t("calendar.description"),
      icon: <Calendar className="h-5 w-5" />,
      status: "coming_soon",
      available: false,
    },
    {
      id: "whatsapp",
      name: t("whatsapp.name"),
      description: t("whatsapp.description"),
      icon: <MessageCircle className="h-5 w-5" />,
      status: "coming_soon",
      available: false,
    },
    {
      id: "crm",
      name: t("crm.name"),
      description: t("crm.description"),
      icon: <Building2 className="h-5 w-5" />,
      status: "coming_soon",
      available: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            description={integration.description}
            icon={integration.icon}
            status={integration.status}
          />
        ))}
      </div>
    </div>
  );
}
