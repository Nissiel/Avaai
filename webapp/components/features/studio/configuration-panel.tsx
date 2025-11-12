"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Phone, Mail, Globe, Save, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ConfigurationPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    organizationName: "",
    adminEmail: "",
    timezone: "europe/paris",
    language: "fr",
    persona: "secretary",
    tone: "warm",
    jobDescription: "",
    guidelines: "",
    phoneNumber: "",
    businessHours: "09:00-18:00",
    fallbackEmail: "",
    summaryEmail: "",
    smtpServer: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
  });

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("✅ Configuration sauvegardée avec succès !");
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      // Error handled by toast notification
      toast.error("❌ Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement de la configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuration d'AVA
        </h2>
        <p className="text-gray-600 mt-2">
          Configurez votre assistante vocale IA pour répondre à vos besoins spécifiques
        </p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Profil de l'Organisation
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-name">Nom de l'organisation</Label>
              <Input
                id="org-name"
                placeholder="Acme Corp"
                className="mt-1"
                value={config.organizationName}
                onChange={(e) => updateConfig("organizationName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-email">Email administrateur</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@acme.com"
                className="mt-1"
                value={config.adminEmail}
                onChange={(e) => updateConfig("adminEmail", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={config.timezone} onValueChange={(value) => updateConfig("timezone", value)}>
                <SelectTrigger id="timezone" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="europe/paris">Europe/Paris</SelectItem>
                  <SelectItem value="america/new_york">America/New York</SelectItem>
                  <SelectItem value="asia/tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Langue</Label>
              <Select value={config.language} onValueChange={(value) => updateConfig("language", value)}>
                <SelectTrigger id="language" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* AVA Personality */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-purple-600" />
          Personnalité d'AVA
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="persona">Type de personnalité</Label>
            <Select
              defaultValue="secretary"
              value={config.persona}
              onValueChange={(value) => updateConfig("persona", value)}
            >
              <SelectTrigger id="persona" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secretary">Secrétaire Exécutive</SelectItem>
                <SelectItem value="concierge">Concierge</SelectItem>
                <SelectItem value="sdr">Sales Development</SelectItem>
                <SelectItem value="cs">Service Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tone">Ton de voix</Label>
            <Select
              defaultValue="warm"
              value={config.tone}
              onValueChange={(value) => updateConfig("tone", value)}
            >
              <SelectTrigger id="tone" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm">Chaleureux</SelectItem>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="energetic">Énergique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="job-description">Mission d'AVA</Label>
            <Textarea
              id="job-description"
              placeholder="Ex: Répondre aux appels entrants 24/7, qualifier les leads et planifier des rendez-vous"
              className="mt-1"
              rows={3}
              value={config.jobDescription}
              onChange={(e) => updateConfig("jobDescription", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="guidelines">Instructions et directives</Label>
            <Textarea
              id="guidelines"
              placeholder="Ex: Toujours saluer par le nom, offrir d'envoyer un email récapitulatif"
              className="mt-1"
              rows={4}
              value={config.guidelines}
              onChange={(e) => updateConfig("guidelines", e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Telephony Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-600" />
          Configuration Téléphonique
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone-number">Numéro de téléphone</Label>
            <Input
              id="phone-number"
              placeholder="+1 415 555 0199"
              className="mt-1"
              value={config.phoneNumber}
              onChange={(e) => updateConfig("phoneNumber", e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Le numéro Twilio sur lequel AVA répondra
            </p>
          </div>
          <div>
            <Label htmlFor="business-hours">Heures d'ouverture</Label>
            <Input
              id="business-hours"
              placeholder="09:00-18:00"
              className="mt-1"
              value={config.businessHours}
              onChange={(e) => updateConfig("businessHours", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fallback-email">Email de secours</Label>
            <Input
              id="fallback-email"
              type="email"
              placeholder="support@acme.com"
              className="mt-1"
              value={config.fallbackEmail}
              onChange={(e) => updateConfig("fallbackEmail", e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Email où les messages urgents seront transférés
            </p>
          </div>
        </div>
      </Card>

      {/* Email Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-orange-600" />
          Notifications Email
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="summary-email">Email pour les résumés d'appels</Label>
            <Input
              id="summary-email"
              type="email"
              placeholder="summaries@acme.com"
              className="mt-1"
              value={config.summaryEmail}
              onChange={(e) => updateConfig("summaryEmail", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-server">Serveur SMTP</Label>
              <Input
                id="smtp-server"
                placeholder="smtp.gmail.com"
                className="mt-1"
                value={config.smtpServer}
                onChange={(e) => updateConfig("smtpServer", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">Port SMTP</Label>
              <Input
                id="smtp-port"
                placeholder="587"
                className="mt-1"
                value={config.smtpPort}
                onChange={(e) => updateConfig("smtpPort", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-username">Nom d'utilisateur SMTP</Label>
              <Input
                id="smtp-username"
                placeholder="notifications@acme.com"
                className="mt-1"
                value={config.smtpUsername}
                onChange={(e) => updateConfig("smtpUsername", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="smtp-password">Mot de passe SMTP</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
                className="mt-1"
                value={config.smtpPassword}
                onChange={(e) => updateConfig("smtpPassword", e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={loadConfig} disabled={saving}>
          Réinitialiser
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder la configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
