import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AvaProfileFormValues, AvaProfileSchema } from "./schema";
import { VoicePreview } from "./VoicePreview";
import { toast } from "sonner";

type PersonaFormProps = {
  defaultValues: AvaProfileFormValues;
};

export function PersonaForm({ defaultValues }: PersonaFormProps) {
  const form = useForm<AvaProfileFormValues>({
    resolver: zodResolver(AvaProfileSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { control } = form;
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const watchingVoice = form.watch("voice");
  const watchingLanguage = form.watch("language");
  const watchingName = form.watch("name");

  const handleSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      const response = await fetch("/api/tenant/ava-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const saved = await response.json();
      form.reset(saved);
      toast.success("Profil Ava mis à jour");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d’enregistrer le profil");
    } finally {
      setSaving(false);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
      <section className="grid gap-4 rounded border border-gray-200 p-6">
        <header>
          <h2 className="text-lg font-semibold">Identité</h2>
          <p className="text-sm text-gray-500">Nom, langue et voix de l’assistante.</p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Nom public</span>
            <input
              {...form.register("name")}
              placeholder="Ava"
              className="rounded border border-gray-300 px-3 py-2"
            />
            {form.formState.errors.name && (
              <span className="text-xs text-red-500">{form.formState.errors.name.message}</span>
            )}
          </label>
          <label className="grid gap-1 text-sm">
            <span>Langue</span>
            <select {...form.register("language")} className="rounded border border-gray-300 px-3 py-2">
              <option value="fr-FR">Français (France)</option>
              <option value="fr-CA">Français (Canada)</option>
              <option value="en-GB">Anglais (UK)</option>
              <option value="en-US">Anglais (US)</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Voix</span>
            <input
              {...form.register("voice")}
              placeholder="fr-feminine-calm"
              className="rounded border border-gray-300 px-3 py-2"
            />
            {form.formState.errors.voice && (
              <span className="text-xs text-red-500">{form.formState.errors.voice.message}</span>
            )}
          </label>
        </div>
        <VoicePreview
          name={watchingName}
          voice={watchingVoice}
          language={watchingLanguage}
          loading={previewLoading}
          onPreviewRequested={async () => {
            setPreviewLoading(true);
            try {
              const response = await fetch("/api/tenant/ava-profile/test-voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text: `Bonjour, je suis ${watchingName || "votre assistante"}.` }),
              });
              if (!response.ok) throw new Error(await response.text());
              const data = await response.json();
              const audio = new Audio(`data:${data.content_type};base64,${data.audio}`);
              await audio.play();
            } catch (error) {
              console.error(error);
              toast.error("Prévisualisation vocale indisponible");
            } finally {
              setPreviewLoading(false);
            }
          }}
        />
      </section>

      <section className="grid gap-4 rounded border border-gray-200 p-6">
        <header>
          <h2 className="text-lg font-semibold">Style & ton</h2>
          <p className="text-sm text-gray-500">Conseils de langage, personnalisation du message d’accueil.</p>
        </header>
        <label className="grid gap-1 text-sm">
          <span>Ton</span>
          <input
            {...form.register("tone")}
            placeholder="chaleureux et professionnel"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.tone && (
            <span className="text-xs text-red-500">{form.formState.errors.tone.message}</span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Personnalité</span>
          <input
            {...form.register("personality")}
            placeholder="amicale, empathique, posée"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.personality && (
            <span className="text-xs text-red-500">{form.formState.errors.personality.message}</span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Message d’accueil</span>
          <textarea
            {...form.register("greeting")}
            rows={3}
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.greeting && (
            <span className="text-xs text-red-500">{form.formState.errors.greeting.message}</span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Signature / conclusion</span>
          <input
            {...form.register("signature_style")}
            placeholder="professionnelle avec une touche humaine"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.signature_style && (
            <span className="text-xs text-red-500">{form.formState.errors.signature_style.message}</span>
          )}
        </label>
      </section>

      <section className="grid gap-4 rounded border border-gray-200 p-6">
        <header>
          <h2 className="text-lg font-semibold">Périmètre & règles</h2>
          <p className="text-sm text-gray-500">Définissez ce que Ava peut ou ne peut pas traiter.</p>
        </header>
        <Controller
          control={control}
          name="allowed_topics"
          render={({ field }) => (
            <label className="grid gap-1 text-sm">
              <span>Sujets autorisés (séparés par ligne)</span>
              <textarea
                value={field.value.join("\n")}
                onChange={(event) =>
                  field.onChange(
                    event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                rows={3}
                className="rounded border border-gray-300 px-3 py-2"
              />
              {form.formState.errors.allowed_topics && (
                <span className="text-xs text-red-500">
                  {form.formState.errors.allowed_topics.root?.message ??
                    form.formState.errors.allowed_topics.message}
                </span>
              )}
            </label>
          )}
        />
        <Controller
          control={control}
          name="forbidden_topics"
          render={({ field }) => (
            <label className="grid gap-1 text-sm">
              <span>Sujets interdits (séparés par ligne)</span>
              <textarea
                value={(field.value ?? []).join("\n")}
                onChange={(event) =>
                  field.onChange(
                    event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                rows={3}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>
          )}
        />
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("can_take_notes")} />
            Peut prendre des notes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("can_summarize_live")} />
            Peut résumer en direct
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span>Comportement hors périmètre</span>
          <input
            {...form.register("fallback_behavior")}
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.fallback_behavior && (
            <span className="text-xs text-red-500">{form.formState.errors.fallback_behavior.message}</span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Règles personnalisées</span>
          <textarea
            {...form.register("custom_rules")}
            rows={4}
            className="rounded border border-gray-300 px-3 py-2"
          />
          {form.formState.errors.custom_rules && (
            <span className="text-xs text-red-500">{form.formState.errors.custom_rules.message}</span>
          )}
        </label>
      </section>

      <footer className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded border border-gray-300 px-4 py-2"
          onClick={() => form.reset(defaultValues)}
          disabled={saving}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
          disabled={!form.formState.isDirty || saving}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </footer>
    </form>
  );
}
