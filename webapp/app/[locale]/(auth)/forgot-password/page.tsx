import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
          <p className="text-muted-foreground">
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
