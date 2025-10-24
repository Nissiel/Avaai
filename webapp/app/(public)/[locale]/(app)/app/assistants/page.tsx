import Link from "next/link";

import { FuturisticButton } from "@/components/ui/futuristic-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantsPage() {
  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Assistants</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos personas vocales, ajustez leur personnalité et connectez-les à vos numéros.
          </p>
        </div>
        <Link href="/onboarding">
          <FuturisticButton size="md" glow>
            Créer un assistant
          </FuturisticButton>
        </Link>
      </header>
      <GlassCard className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vos assistants</h2>
            <p className="text-sm text-muted-foreground">Ils apparaîtront ici dès qu’ils seront synchronisés depuis Vapi.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <GlassCard key={item} className="flex h-40 flex-col justify-between bg-muted/20" variant="none">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-9 w-full" />
            </GlassCard>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre compte Vapi pour afficher automatiquement vos assistants existants.
        </p>
      </GlassCard>
    </section>
  );
}
