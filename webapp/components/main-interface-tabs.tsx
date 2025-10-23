"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CallInterface from "@/components/call-interface";
import { ConfigurationPanel } from "@/components/configuration-panel";
import { BackendControl } from "@/components/backend-control";
import ChecklistAndConfig from "@/components/checklist-and-config";
import { CheckCircle2, Settings, LayoutDashboard, Wrench } from "lucide-react";

export default function MainInterfaceTabs() {
  const [activeTab, setActiveTab] = useState("status");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [allConfigsReady, setAllConfigsReady] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">AVA - Assistante Vocale IA</h1>
            <p className="text-sm text-gray-600 mt-1">
              Votre secrétaire téléphonique intelligente alimentée par OpenAI
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <TabsList className="bg-transparent border-b-0 h-14 space-x-8">
                <TabsTrigger
                  value="status"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 pb-4 pt-4 font-medium transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Statut Rapide
                </TabsTrigger>
                <TabsTrigger
                  value="setup"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 pb-4 pt-4 font-medium transition-all"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Setup & Checks
                </TabsTrigger>
                <TabsTrigger
                  value="configuration"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 pb-4 pt-4 font-medium transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 pb-4 pt-4 font-medium transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="status" className="h-full m-0 p-0">
              <div className="h-full flex flex-col">
                {/* Backend Control Card - en haut */}
                <div className="bg-white border-b border-gray-200 px-6 py-6">
                  <div className="max-w-7xl mx-auto">
                    <BackendControl />
                  </div>
                </div>
                
                {/* Call Interface - en dessous */}
                <div className="flex-1">
                  <CallInterface />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="h-full m-0 p-0">
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Setup & Vérifications</h2>
                  <p className="text-gray-600 mt-2">
                    Vérifiez que tous les composants sont correctement configurés avant d'utiliser AVA
                  </p>
                </div>
                <ChecklistAndConfig
                  ready={allConfigsReady}
                  setReady={setAllConfigsReady}
                  selectedPhoneNumber={selectedPhoneNumber}
                  setSelectedPhoneNumber={setSelectedPhoneNumber}
                />
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="h-full m-0 p-0">
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <ConfigurationPanel />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="h-full m-0 p-0">
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-xl font-semibold mb-4">Dashboard Analytics</h2>
                  <p className="text-gray-600">
                    📊 Statistiques des appels, métriques de performance, et historique des conversations
                    apparaîtront ici.
                  </p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-gray-600 mt-1">Appels aujourd'hui</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-green-600">0%</div>
                      <div className="text-sm text-gray-600 mt-1">Taux de réponse</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-purple-600">0m</div>
                      <div className="text-sm text-gray-600 mt-1">Durée moyenne</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
