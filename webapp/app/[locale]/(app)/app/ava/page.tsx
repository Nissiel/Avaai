"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { VOICE_TONES } from "@/lib/constants";
import { Label } from "@/components/ui/label";

const playbooks = [
  {
    id: "reception",
    title: "Reception & pre-qualification",
    description: "Answers frontline calls, captures contact data, and books the right slot automatically.",
  },
  {
    id: "sales",
    title: "Sales discovery",
    description: "Qualifies inbound demand, surfaces intent score, and syncs notes to CRM.",
  },
  {
    id: "support",
    title: "Customer success",
    description: "Answers FAQs, collects context, and escalates to humans with summarized transcripts.",
  },
];

const sampleResponses: Record<string, string> = {
  warm: "Bonjour Camila, ici Ava de Lex & Co. Je peux vous proposer mardi 10h45 ou mercredi 14h15 pour votre consultation. Quelle option vous arrange ?",
  professional:
    "Good afternoon Rohan, this is Ava on behalf of Nova Clinic. I can confirm availability on June 21st at 09:30. Shall I lock it in and send the prep checklist?",
  energetic:
    "Hey Omar! Ava here from Orbit Ventures. I've got a 15:00 opening with Maya tomorrow—perfect for a quick discovery. Want me to secure it?",
};

export default function AvaStudioPage() {
  const [tone, setTone] = useState<typeof VOICE_TONES[number]>("warm");
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Ava Studio</h1>
        <p className="text-sm text-muted-foreground">
          Tune persona, tone, guardrails, and playbooks for every channel. Changes autosave and create snapshots for rollback.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Persona builder</CardTitle>
                  <CardDescription>Define how Ava introduces herself and what she must capture.</CardDescription>
                </div>
                <Toggle pressed={autoSave} onPressedChange={setAutoSave}>
                  Auto-save {autoSave ? "on" : "off"}
                </Toggle>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ava-display-name" className="text-sm font-semibold">Display name</Label>
                  <Input id="ava-display-name" defaultValue="Ava" placeholder="Assistant name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ava-role" className="text-sm font-semibold">Role</Label>
                  <Input id="ava-role" defaultValue="Concierge" placeholder="e.g. Concierge" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ava-opening-line" className="text-sm font-semibold">Opening line</Label>
                <Textarea
                  id="ava-opening-line"
                  rows={2}
                  defaultValue="Hello! You're speaking with Ava, the assistant for Lex & Co. How may I help you today?"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Mandatory fields</p>
                <div className="flex flex-wrap gap-3">
                  {["Full name", "Email", "Phone", "Reason"].map((field) => (
                    <Badge key={field} variant="accent" className="bg-brand-500/10 text-brand-600">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Tone & voice preview</CardTitle>
                  <CardDescription>Select a base tone and tweak expressions. Preview voice and text reply instantly.</CardDescription>
                </div>
                <div className="flex gap-2">
                  {VOICE_TONES.map((voice) => (
                    <Button
                      key={voice}
                      size="sm"
                      variant={tone === voice ? "primary" : "outline"}
                      onClick={() => setTone(voice)}
                    >
                      {voice}
                    </Button>
                  ))}
                </div>
              </div>
              <Tabs defaultValue="text">
                <TabsList>
                  <TabsTrigger value="text">Text reply</TabsTrigger>
                  <TabsTrigger value="voice">Voice</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="space-y-3">
                  <Textarea rows={4} value={sampleResponses[tone]} readOnly />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="accent" className="bg-accent/40">
                      Tone: {tone}
                    </Badge>
                    <Badge variant="accent" className="bg-accent/40">
                      Guardrails: escalation on emergency
                    </Badge>
                  </div>
                </TabsContent>
                <TabsContent value="voice" className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted-foreground">Preview Ava's neural voice in {tone} tone.</p>
                  <Button size="sm">Play sample</Button>
                  <Button variant="ghost" size="sm">
                    Upload custom voice
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <CardTitle className="text-lg">Guardrails</CardTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Escalate when</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>Caller mentions emergency keywords</li>
                    <li>Revenue potential above $50k</li>
                    <li>More than 2 clarification attempts</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold">Forbidden expressions</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {['I am a bot', 'I cannot help', 'Policy'].map((expression) => (
                      <Badge key={expression} variant="outline">
                        {expression}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Textarea
                rows={3}
                placeholder="Additional guardrails (e.g. never reschedule VIP calls without human approval)."
              />
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <CardTitle className="text-lg">Playbooks</CardTitle>
              <CardDescription>Start from presets and fork them per channel or campaign.</CardDescription>
              <div className="space-y-3">
                {playbooks.map((playbook) => (
                  <div key={playbook.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <p className="text-sm font-semibold">{playbook.title}</p>
                    <p className="text-xs text-muted-foreground">{playbook.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="ghost">
                        Preview
                      </Button>
                      <Button size="sm">
                        Clone
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full">
                Import playbook
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <CardTitle className="text-lg">Snapshots</CardTitle>
              <p>Every publish creates a snapshot with diff view and instant rollback.</p>
              <Button size="sm" variant="outline" className="w-full">
                View history
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
