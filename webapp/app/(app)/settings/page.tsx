import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Personnalisez votre organisation, configurez la facturation et gérez les accès.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard className="space-y-6" variant="none">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Profil d’organisation</h2>
            <p className="text-sm text-muted-foreground">Ces informations sont utilisées dans les emails et les scripts d’appel.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nom</Label>
              <Input id="org-name" placeholder="Ava Studio" defaultValue="Ava" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email de support</Label>
              <Input id="org-email" placeholder="support@ava.ai" defaultValue="support@ava.ai" disabled />
            </div>
          </div>
          <Button disabled size="sm" className="w-fit" variant="outline">
            Éditer (bientôt)
          </Button>
        </GlassCard>
        <GlassCard className="space-y-4" variant="none">
          <h2 className="text-lg font-semibold">Facturation</h2>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <p className="text-sm text-muted-foreground">
            Votre plan et vos usages détaillés seront synchronisés dès l’intégration du backend billing.
          </p>
        </GlassCard>
      </div>
    </section>
  );
}
