import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LoginForm = dynamic(() => import("@/components/auth/login-form").then((mod) => ({ default: mod.LoginForm })), {
  ssr: false,
});

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth.login" });
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

function LoginPageContent({ locale }: { locale: string }) {
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute left-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[120px]" />
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link 
            href={`/${locale}` as any}
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{tCommon("nav.home")}</span>
          </Link>
          
          <div className="mb-8 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/25">
              <span className="text-3xl font-bold text-white">A</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                {t("title")} 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-background/95 p-8 shadow-2xl backdrop-blur-xl">
            <LoginForm />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link 
                href={`/${locale}/signup` as any}
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t("createAccount")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  
  return <LoginPageContent locale={params.locale} />;
}
