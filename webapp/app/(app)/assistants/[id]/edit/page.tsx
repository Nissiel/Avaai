'use client';

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FunctionBuilder } from "@/components/features/assistant/function-builder";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturisticButton } from "@/components/ui/futuristic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { getAssistantDetail, updateAssistant } from "@/lib/api/assistants";
import type { AssistantDetail, AssistantFunctionDefinition, UpdateAssistantPayload } from "@/lib/dto";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <GlassCard className="flex h-[500px] items-center justify-center">
      <Skeleton className="h-full w-full" />
    </GlassCard>
  ),
});

const DEFAULT_PROMPT = `Tu es AVA, une assistante vocale professionnelle et empathique.

Ton rôle:
- Répondre aux questions avec clarté et précision
- Être chaleureuse et rassurante
- Adapter ton langage au contexte
- Toujours confirmer avant d'exécuter une action

Variables disponibles:
- {name}: Nom de l'utilisateur
- {company}: Nom de l'entreprise
- {context}: Contexte de l'appel

Instructions spéciales:
- Si l'utilisateur demande un rendez-vous, utilise la fonction create_calendar_event
- Si l'utilisateur veut laisser un message, utilise send_email
- Toujours demander confirmation avant d'exécuter une fonction
`;

const PERSONALITY_TEMPLATES = [
  { id: "pro", name: "Assistante Pro", desc: "Formelle et efficace" },
  { id: "coach", name: "Coach Motivant", desc: "Énergique et encourageante" },
  { id: "empathy", name: "Conseiller Empathique", desc: "À l’écoute et rassurant" },
  { id: "expert", name: "Expert Technique", desc: "Précis et factuel" },
] as const;

function getInitialPrompt(assistant?: AssistantDetail) {
  return assistant?.systemPrompt ?? assistant?.instructions ?? DEFAULT_PROMPT;
}

export default function AssistantEditPage() {
  const params = useParams();
  const assistantId = params?.id as string;

  const queryClient = useQueryClient();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [functions, setFunctions] = useState<AssistantFunctionDefinition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: assistant, isLoading } = useQuery({
    queryKey: ["assistant", assistantId],
    queryFn: () => getAssistantDetail(assistantId),
    enabled: Boolean(assistantId),
  });

  useEffect(() => {
    if (assistant) {
      setSystemPrompt(getInitialPrompt(assistant));
      setFunctions(assistant.functions ?? []);
      const personality = String(assistant.metadata?.personality ?? "");
      setSelectedTemplate(personality || null);
    }
  }, [assistant]);

  const mutation = useMutation({
    mutationFn: async () => {
      const metadata = {
        ...(assistant?.metadata ?? {}),
        personality: selectedTemplate ?? undefined,
      };

      const payload: UpdateAssistantPayload = {
        id: assistantId,
        instructions: systemPrompt,
        functions,
        metadata,
        voice: assistant?.voice,
        firstMessage: assistant?.firstMessage,
        name: assistant?.name,
        phoneNumber: assistant?.phoneNumber,
        model: assistant?.model,
      };

      return updateAssistant(payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["assistant", assistantId] });
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Assistant mis à jour avec succès ✨");
      setFunctions(updated.functions ?? []);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Impossible de sauvegarder";
      toast.error(message);
    },
  });

  const isSaving = mutation.isPending;
  const isDirty = useMemo(() => {
    if (!assistant) return false;
    const templateDirty =
      (selectedTemplate ?? "") !== String(assistant.metadata?.personality ?? "");
    const promptDirty = systemPrompt.trim() !== getInitialPrompt(assistant).trim();
    const functionsDirty =
      JSON.stringify(functions) !== JSON.stringify(assistant.functions ?? []);
    return templateDirty || promptDirty || functionsDirty;
  }, [assistant, functions, selectedTemplate, systemPrompt]);

  const handleSave = () => {
    if (!assistant) return;
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Assistant #{assistantId}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Prompt & Personnalisation</h1>
          <p className="text-sm text-muted-foreground">
            Ajustez la personnalité, les fonctions et les instructions système.
          </p>
        </div>
        <FuturisticButton glow disabled={!isDirty || isSaving} onClick={handleSave}>
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </FuturisticButton>
      </div>

      {isLoading && !assistant ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-[480px] rounded-2xl" />
        </div>
      ) : (
        <Tabs defaultValue="prompt" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompt">System prompt</TabsTrigger>
            <TabsTrigger value="personality">Personnalité</TabsTrigger>
            <TabsTrigger value="functions">Fonctions</TabsTrigger>
            <TabsTrigger value="testing">Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-6">
            <GlassCard className="p-0">
              <MonacoEditor
                height="520px"
                language="markdown"
                theme="vs-dark"
                value={systemPrompt}
                onChange={(value) => setSystemPrompt(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </GlassCard>

            <GlassCard variant="none" className="bg-primary/10">
              <h3 className="mb-3 font-semibold">💡 Suggestions IA</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Définir le ton exact attendu pour chaque étape de conversation.</li>
                <li>• Ajouter un exemple de réponse pour clarifier le style attendu.</li>
                <li>• Préciser les cas où déclencher chaque fonction.</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-4 font-semibold">Variables disponibles</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { token: "{name}", desc: "Nom de l'appelant" },
                  { token: "{company}", desc: "Entreprise associée" },
                  { token: "{context}", desc: "Résumé du contexte fourni" },
                  { token: "{date}", desc: "Date actuelle" },
                ].map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => setSystemPrompt((value) => `${value}\n${item.token}`)}
                    className="rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <code className="text-sm font-mono text-primary">{item.token}</code>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <GlassCard>
              <h3 className="mb-4 font-semibold">Templates</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {PERSONALITY_TEMPLATES.map((template) => {
                  const isActive = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(isActive ? null : template.id)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted/20 hover:border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.desc}</p>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-6 font-semibold">Ajuster les traits</h3>
              <div className="space-y-5">
                {[
                  { label: "Amicalité", value: 70 },
                  { label: "Formalité", value: 50 },
                  { label: "Énergie", value: 60 },
                  { label: "Empathie", value: 80 },
                ].map((trait) => (
                  <div key={trait.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-foreground">{trait.label}</span>
                      <span className="text-muted-foreground">{trait.value}%</span>
                    </div>
                    <input type="range" min="0" max="100" defaultValue={trait.value} className="w-full" disabled />
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="functions">
            <FunctionBuilder value={functions} onChange={setFunctions} />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <GlassCard>
              <h3 className="mb-4 font-semibold">Simulateur de conversation</h3>
              <div className="flex h-[360px] items-center justify-center rounded-2xl bg-muted/20 text-muted-foreground">
                Interface de test en direct à venir
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Saisissez un message test..."
                  className="flex-1 rounded-lg bg-muted/30 px-4 py-2 text-sm"
                  disabled
                />
                <FuturisticButton disabled>Envoyer</FuturisticButton>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
