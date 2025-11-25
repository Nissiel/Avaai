"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Mic, Settings2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import type { FlowNode, NodeConfig } from "./types";
import { useState, useEffect } from "react";

interface NodeEditorSidebarProps {
  node: FlowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: NodeConfig) => void;
}

const VOICE_PROVIDER_OPTIONS = [
  { value: "azure", label: "Azure Neural" },
  { value: "11labs", label: "ElevenLabs" },
  { value: "playht", label: "PlayHT" },
];

const TONE_OPTIONS = [
  { value: "warm", label: "Warm & Friendly" },
  { value: "professional", label: "Professional" },
  { value: "energetic", label: "Energetic" },
];

export function NodeEditorSidebar({
  node,
  isOpen,
  onClose,
  onSave,
}: NodeEditorSidebarProps) {
  const [config, setConfig] = useState<NodeConfig>({});

  // Sync config when node changes
  useEffect(() => {
    if (node) {
      setConfig(node.config);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-background border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <node.icon className="h-6 w-6 text-brand-600" />
                    {node.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {node.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <Tabs defaultValue="prompt" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prompt" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-2">
                    <Mic className="h-4 w-4" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                {/* Prompt Tab */}
                <TabsContent value="prompt" className="space-y-6">
                  <GlassCard className="border p-5" variant="none">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="systemPrompt" className="text-base font-semibold">
                          System Prompt
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Define how your AI assistant should behave during this step
                        </p>
                        <Textarea
                          id="systemPrompt"
                          rows={12}
                          value={config.systemPrompt || ""}
                          onChange={(e) =>
                            setConfig({ ...config, systemPrompt: e.target.value })
                          }
                          placeholder="You are a helpful AI assistant. Your goal is to..."
                          className="resize-y font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {config.systemPrompt?.length || 0} characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="firstMessage" className="text-base font-semibold">
                          First Message
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Initial greeting when the call starts
                        </p>
                        <Input
                          id="firstMessage"
                          value={config.firstMessage || ""}
                          onChange={(e) =>
                            setConfig({ ...config, firstMessage: e.target.value })
                          }
                          placeholder="Hello! How can I help you today?"
                        />
                      </div>

                      <div>
                        <Label htmlFor="guidelines" className="text-base font-semibold">
                          Additional Guidelines
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Extra behavioral instructions
                        </p>
                        <Textarea
                          id="guidelines"
                          rows={6}
                          value={config.guidelines || ""}
                          onChange={(e) =>
                            setConfig({ ...config, guidelines: e.target.value })
                          }
                          placeholder="- Always be polite&#10;- Keep responses concise&#10;- ..."
                          className="resize-y"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </TabsContent>

                {/* Voice Tab */}
                <TabsContent value="voice" className="space-y-6">
                  <GlassCard className="border p-5" variant="none">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="voiceProvider" className="text-base font-semibold">
                          Voice Provider
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Choose the text-to-speech provider
                        </p>
                        <Select
                          value={config.voiceProvider || "azure"}
                          onValueChange={(value) =>
                            setConfig({ ...config, voiceProvider: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_PROVIDER_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="voiceId" className="text-base font-semibold">
                          Voice ID
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Specific voice to use (e.g., fr-FR-DeniseNeural)
                        </p>
                        <Input
                          id="voiceId"
                          value={config.voiceId || ""}
                          onChange={(e) =>
                            setConfig({ ...config, voiceId: e.target.value })
                          }
                          placeholder="fr-FR-DeniseNeural"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold">Voice Speed</Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Adjust speaking speed
                        </p>
                        <LabeledSlider
                          label=""
                          description="0.5x = Slow | 1.0x = Normal | 1.2x = Fast"
                          min={0.5}
                          max={1.2}
                          step={0.05}
                          value={config.voiceSpeed || 1.0}
                          onChange={(value) =>
                            setConfig({ ...config, voiceSpeed: value })
                          }
                          valueFormatter={(v) => `${v.toFixed(2)}x`}
                        />
                      </div>

                      <div>
                        <Label htmlFor="tone" className="text-base font-semibold">
                          Conversation Tone
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          Overall tone and personality
                        </p>
                        <Select
                          value={config.tone || "warm"}
                          onValueChange={(value) =>
                            setConfig({ ...config, tone: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TONE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </GlassCard>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <GlassCard className="border p-5" variant="none">
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4 border border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">Coming soon:</strong>{" "}
                          Advanced configuration options including AI model selection,
                          temperature settings, max tokens, and more.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          For now, these settings are managed globally in the main
                          assistant configuration.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer - Save Button */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-6">
              <Button
                onClick={handleSave}
                size="lg"
                className="w-full gap-2 h-12"
              >
                <Save className="h-5 w-5" />
                Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
