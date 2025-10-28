import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Zap, Shield } from "lucide-react";

// Dynamic import with ssr:false to prevent hydration issues
const SignupForm = dynamic(
  () => import("@/components/auth/signup-form").then((mod) => ({ default: mod.SignupForm })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
);

export default function SignupPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Ambient effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[120px]" />
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link 
            href={`/${locale}` as any}
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Link>
          
          {/* Header */}
          <div className="mb-8 space-y-4 text-center">
            {/* Logo */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/25">
              <span className="text-3xl font-bold text-white">A</span>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Commencez gratuitement
              </h1>
              <p className="text-lg text-muted-foreground">
                Votre réceptionniste IA en 3 minutes ⚡
              </p>
            </div>
          </div>

          {/* Benefits badges */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              <span>Setup instantané</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gratuit 7 jours</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
              <Shield className="h-3.5 w-3.5" />
              <span>Données sécurisées</span>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-border/60 bg-background/95 p-8 shadow-2xl backdrop-blur-xl">
            <SignupForm />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link 
                href={`/${locale}/login` as any}
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
