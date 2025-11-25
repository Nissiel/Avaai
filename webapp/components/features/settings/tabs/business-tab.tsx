"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Target, FileText, Upload, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/ui/section-card";
import { DataRow } from "@/components/ui/data-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBusinessProfile, updateBusinessProfile, type BusinessProfileUpdate } from "@/lib/api/business-profile";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Education",
  "Real Estate",
  "Consulting",
  "Manufacturing",
  "Hospitality",
  "Legal",
  "Marketing",
  "Other",
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

export function BusinessTab() {
  const t = useTranslations("settingsPage.business");
  const queryClient = useQueryClient();
  const [newService, setNewService] = useState("");

  // Fetch business profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["businessProfile"],
    queryFn: getBusinessProfile,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateBusinessProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
      toast.success("Business profile updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update", { description: error.message });
    },
  });

  const handleFieldChange = (field: keyof BusinessProfileUpdate, value: string | string[] | null) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleAddService = () => {
    const currentServices = profile?.services || [];
    if (newService.trim() && !currentServices.includes(newService.trim())) {
      const newServices = [...currentServices, newService.trim()];
      handleFieldChange("services", newServices);
      setNewService("");
    }
  };

  const handleRemoveService = (service: string) => {
    const currentServices = profile?.services || [];
    const newServices = currentServices.filter((s) => s !== service);
    handleFieldChange("services", newServices);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddService();
    }
  };

  return (
    <div className="space-y-4">
      {/* Company Identity Section */}
      <SectionCard
        title={t("identity.title")}
        description={t("identity.description")}
        icon={<Building2 className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="divide-y divide-border/50">
          <DataRow
            label={t("identity.companyName")}
            value={profile?.company_name ?? ""}
            onSave={(value) => handleFieldChange("company_name", value)}
            placeholder={t("identity.companyNamePlaceholder")}
            disabled={updateMutation.isPending}
          />

          <DataRow
            label={t("identity.website")}
            value={profile?.website ?? ""}
            onSave={(value) => handleFieldChange("website", value)}
            type="url"
            placeholder="https://example.com"
            disabled={updateMutation.isPending}
          />

          {/* Industry dropdown */}
          <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
              {t("identity.industry")}
            </span>
            <Select
              value={profile?.industry ?? ""}
              onValueChange={(value) => handleFieldChange("industry", value)}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue placeholder={t("identity.industryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company size dropdown */}
          <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
              {t("identity.companySize")}
            </span>
            <Select
              value={profile?.company_size ?? ""}
              onValueChange={(value) => handleFieldChange("company_size", value)}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-8 w-[120px] text-sm">
                <SelectValue placeholder={t("identity.companySizePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Business Focus Section */}
      <SectionCard
        title={t("focus.title")}
        description={t("focus.sectionDescription")}
        icon={<Target className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("focus.businessDescription")}
            </label>
            <textarea
              value={profile?.description ?? ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              onBlur={(e) => handleFieldChange("description", e.target.value)}
              placeholder={t("focus.descriptionPlaceholder")}
              rows={3}
              disabled={updateMutation.isPending}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            />
          </div>

          {/* Services/Products tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("focus.services")}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(profile?.services || []).map((service) => (
                <Badge
                  key={service}
                  variant="neutral"
                  className="flex items-center gap-1 pr-1"
                >
                  {service}
                  <button
                    onClick={() => handleRemoveService(service)}
                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted"
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("focus.servicesPlaceholder")}
                className="h-8 text-sm flex-1"
                disabled={updateMutation.isPending}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddService}
                disabled={!newService.trim() || updateMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Target Market */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("focus.targetMarket")}
            </label>
            <Input
              value={profile?.target_market ?? ""}
              onChange={(e) => handleFieldChange("target_market", e.target.value)}
              placeholder={t("focus.targetMarketPlaceholder")}
              className="h-9 text-sm"
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Value Proposition */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("focus.valueProposition")}
            </label>
            <Input
              value={profile?.value_proposition ?? ""}
              onChange={(e) => handleFieldChange("value_proposition", e.target.value)}
              placeholder={t("focus.valuePropositionPlaceholder")}
              className="h-9 text-sm"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
      </SectionCard>

      {/* Knowledge Base Section */}
      <SectionCard
        title={t("knowledge.title")}
        description={t("knowledge.description")}
        icon={<FileText className="h-4 w-4" />}
        defaultOpen={false}
        action={
          <Badge variant="outline" className="text-xs">
            Coming Soon
          </Badge>
        }
      >
        <div
          className={cn(
            "border-2 border-dashed border-border/50 rounded-lg p-6",
            "flex flex-col items-center justify-center text-center",
            "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("knowledge.dropzone")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("knowledge.fileTypes")}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
