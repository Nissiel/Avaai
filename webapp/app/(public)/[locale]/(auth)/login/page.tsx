import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

// Avoid rendering a fallback during hydration to keep server/client markup in sync
const LoginForm = dynamic(() => import("@/components/auth/login-form").then((mod) => ({ default: mod.LoginForm })), {
  ssr: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  
  return {
    title: t("login.title", { defaultValue: "Connexion" }),
    description: t("login.description", {
      defaultValue: "Connectez-vous à votre compte AVA",
    }),
  };
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-brand-500/5">
      <div className="container flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenue sur AVA
            </h1>
            <p className="text-base text-muted-foreground">
              Connectez-vous pour accéder à votre réceptionniste IA
            </p>
          </div>

          {/* Login Form Card */}
          <div className="rounded-3xl border border-border/60 bg-background/95 p-8 shadow-elevated backdrop-blur-sm">
            <LoginForm />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            En vous connectant, vous acceptez nos{" "}
            <a
              href="/terms"
              className="font-medium text-brand-600 underline-offset-4 hover:underline"
            >
              Conditions
            </a>{" "}
            et notre{" "}
            <a
              href="/privacy"
              className="font-medium text-brand-600 underline-offset-4 hover:underline"
            >
              Politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
