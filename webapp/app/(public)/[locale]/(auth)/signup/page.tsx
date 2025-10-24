import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import with ssr:false to prevent hydration issues
const SignupForm = dynamic(
  () => import("@/components/auth/signup-form").then((mod) => ({ default: mod.SignupForm })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-5">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
);

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-brand-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* ===== HERO SECTION ===== */}
        <div className="text-center space-y-4">
          {/* AVA Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Créez votre compte AVA
            </h1>
            <p className="text-muted-foreground text-base">
              Votre réceptionniste IA en quelques minutes
            </p>
          </div>
        </div>

        {/* ===== GLASSMORPHISM CARD ===== */}
        <div className="rounded-3xl border bg-background/95 backdrop-blur-sm shadow-elevated p-8">
          <SignupForm />
        </div>

        {/* ===== FOOTER ===== */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link 
              href="/terms" 
              className="hover:text-brand-600 transition-colors"
            >
              Conditions d'utilisation
            </Link>
            <span>•</span>
            <Link 
              href="/privacy" 
              className="hover:text-brand-600 transition-colors"
            >
              Confidentialité
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            © 2025 AVA. Tous droits réservés.
          </p>
        </div>

      </div>
    </div>
  );
}
