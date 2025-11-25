import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

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

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
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
          <div className="mb-6 space-y-3 text-center">
            {/* Logo */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/25">
              <span className="text-2xl font-bold text-white">A</span>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-tight">
                Commencez gratuitement
              </h1>
              <p className="text-base text-muted-foreground">
                Votre réceptionniste IA en 3 minutes ⚡
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
