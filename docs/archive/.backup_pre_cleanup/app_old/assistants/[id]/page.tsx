import { notFound } from "next/navigation";

import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

interface AssistantDetailsPageProps {
  params: { id?: string };
}

export default function AssistantDetailsPage({ params }: AssistantDetailsPageProps) {
  const { id } = params;
  if (!id) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Assistant</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{id}</h1>
        <p className="text-sm text-muted-foreground">
          Cette page affichera les paramètres, la voix et les fonctions de votre assistant.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="space-y-4">
          <h2 className="text-lg font-semibold">Personnalisation</h2>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </GlassCard>
        <GlassCard className="space-y-4">
          <h2 className="text-lg font-semibold">Raccourcis</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>⌘S — Sauvegarder les modifications</li>
            <li>⌘P — Aperçu de la voix</li>
            <li>⌘/ — Afficher la palette de commandes</li>
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}
