"use client";

import { useEffect, useState } from "react";
import { PersonaForm } from "@/components/ava/PersonaForm";
import { AvaProfileFormValues } from "@/components/ava/schema";
import { toast } from "sonner";

const fetchProfile = async (): Promise<AvaProfileFormValues> => {
  const response = await fetch("/api/tenant/ava-profile", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Impossible de charger le profil Ava");
  }
  return response.json();
};

export default function AvaSettingsPage() {
  const [initialValues, setInitialValues] = useState<AvaProfileFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then((profile) => setInitialValues(profile))
      .catch((error) => {
        console.error(error);
        toast.error("Chargement impossible du profil Ava");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !initialValues) {
    return (
      <div className="flex flex-col gap-2 rounded border border-gray-200 p-8">
        <h1 className="text-xl font-semibold">Personnalité d&apos;Ava</h1>
        <p className="text-sm text-gray-500">Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Personnalité d&apos;Ava</h1>
        <p className="text-sm text-gray-500">
          Ajustez l’identité, la voix, les sujets autorisés et les règles de conduite de votre assistante.
        </p>
      </header>
      <PersonaForm defaultValues={initialValues} />
    </div>
  );
}
