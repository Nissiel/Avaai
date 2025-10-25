"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.APP_BACKEND_URL ??
  process.env.NEXT_PUBLIC_APP_BACKEND_URL ??
  "http://localhost:8000";

interface DiagnosticResponse {
  status: string;
  timestamp: string;
  localConfig: {
    assistantId: string;
    organizationName: string;
    voiceProvider: string;
    voiceId: string;
    voiceSpeed: number;
    firstMessage: string;
    aiModel: string;
    aiTemperature: number;
    aiMaxTokens: number;
    systemPrompt: string;
    askForName: boolean;
    askForEmail: boolean;
    askForPhone: boolean;
  };
  vapiAssistant: {
    found: boolean;
    id: string | null;
    name: string | null;
    error: string | null;
    data: any;
  };
  phoneNumbers: {
    count: number;
    numbers: Array<{
      id: string;
      number: string;
      assistantId: string;
      matchesConfig: boolean;
    }>;
    error: string | null;
    allMatchConfig: boolean;
  };
  differences: {
    count: number;
    details: Array<{
      field: string;
      local: any;
      vapi: any;
    }>;
  };
  recommendations: string[];
}

export default function DiagnosticPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/v1/studio/diagnostic`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setDiagnostic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      console.error("Erreur diagnostic:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔬 Diagnostic Vapi</h1>
          <p className="text-muted-foreground">
            Vérification complète de la synchronisation AVA
          </p>
        </div>

        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Lancer le diagnostic
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {diagnostic && (
        <div className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Recommandations</CardTitle>
              <CardDescription>
                Dernière analyse: {new Date(diagnostic.timestamp).toLocaleString("fr-FR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {diagnostic.recommendations.map((rec, i) => {
                const isSuccess = rec.startsWith("✅");
                const isWarning = rec.startsWith("⚠️");
                const isError = rec.startsWith("❌");

                return (
                  <div
                    key={i}
                    className={`flex items-start p-3 rounded-lg ${isSuccess ? "bg-green-50 dark:bg-green-950" :
                        isError ? "bg-red-50 dark:bg-red-950" :
                          "bg-yellow-50 dark:bg-yellow-950"
                      }`}
                  >
                    {isSuccess && <CheckCircle2 className="mr-2 h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    {isError && <XCircle className="mr-2 h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    {isWarning && <AlertCircle className="mr-2 h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                    <span>{rec}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Local Config */}
          <Card>
            <CardHeader>
              <CardTitle>💻 Configuration Locale</CardTitle>
              <CardDescription>
                Configuration actuelle dans le backend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">Assistant ID</dt>
                  <dd className="font-mono text-sm">{diagnostic.localConfig.assistantId || "Non défini"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">Organisation</dt>
                  <dd>{diagnostic.localConfig.organizationName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">Voice</dt>
                  <dd>{diagnostic.localConfig.voiceProvider} - {diagnostic.localConfig.voiceId}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">Voice Speed</dt>
                  <dd>{diagnostic.localConfig.voiceSpeed}x</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">AI Model</dt>
                  <dd>{diagnostic.localConfig.aiModel}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sm text-muted-foreground">Temperature</dt>
                  <dd>{diagnostic.localConfig.aiTemperature}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-semibold text-sm text-muted-foreground">System Prompt</dt>
                  <dd className="text-sm mt-1 p-2 bg-muted rounded">{diagnostic.localConfig.systemPrompt}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Vapi Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                ☁️ Assistant Vapi
                {diagnostic.vapiAssistant.found ? (
                  <Badge className="ml-2 bg-green-600">Trouvé</Badge>
                ) : (
                  <Badge variant="danger" className="ml-2">Non trouvé</Badge>
                )}
              </CardTitle>
              <CardDescription>
                État de l'assistant sur la plateforme Vapi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnostic.vapiAssistant.error && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded mb-4">
                  <p className="text-sm text-red-600">Erreur: {diagnostic.vapiAssistant.error}</p>
                </div>
              )}

              {diagnostic.vapiAssistant.found && (
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="font-semibold text-sm text-muted-foreground">ID</dt>
                    <dd className="font-mono text-sm">{diagnostic.vapiAssistant.id}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-sm text-muted-foreground">Nom</dt>
                    <dd>{diagnostic.vapiAssistant.name}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📞 Numéros de téléphone
                <Badge className="ml-2">{diagnostic.phoneNumbers.count} numéro(s)</Badge>
                {diagnostic.phoneNumbers.allMatchConfig && (
                  <Badge className="ml-2 bg-green-600">Tous synchronisés</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Numéros Vapi et leurs assistants associés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnostic.phoneNumbers.error && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded mb-4">
                  <p className="text-sm text-red-600">Erreur: {diagnostic.phoneNumbers.error}</p>
                </div>
              )}

              <div className="space-y-2">
                {diagnostic.phoneNumbers.numbers.map((phone) => (
                  <div
                    key={phone.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${phone.matchesConfig
                        ? "border-green-200 bg-green-50 dark:bg-green-950"
                        : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"
                      }`}
                  >
                    <div>
                      <p className="font-semibold">{phone.number}</p>
                      <p className="text-sm text-muted-foreground font-mono">{phone.assistantId || "Aucun assistant"}</p>
                    </div>
                    {phone.matchesConfig ? (
                      <Badge className="bg-green-600">Synchronisé</Badge>
                    ) : (
                      <Badge variant="outline">Différent</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Differences */}
          {diagnostic.differences.count > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  ⚠️ Différences détectées ({diagnostic.differences.count})
                </CardTitle>
                <CardDescription>
                  Configuration locale différente de Vapi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnostic.differences.details.map((diff, i) => (
                    <div key={i} className="border-l-4 border-yellow-400 pl-4">
                      <p className="font-semibold">{diff.field}</p>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Local:</p>
                          <p className="font-mono bg-muted p-2 rounded mt-1">
                            {typeof diff.local === "object" ? JSON.stringify(diff.local) : String(diff.local)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vapi:</p>
                          <p className="font-mono bg-muted p-2 rounded mt-1">
                            {typeof diff.vapi === "object" ? JSON.stringify(diff.vapi) : String(diff.vapi)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
