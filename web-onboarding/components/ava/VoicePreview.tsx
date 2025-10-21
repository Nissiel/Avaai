type VoicePreviewProps = {
  name: string;
  voice: string;
  language: string;
  loading: boolean;
  onPreviewRequested: () => Promise<void>;
};

export function VoicePreview({ name, voice, language, loading, onPreviewRequested }: VoicePreviewProps) {
  return (
    <div className="flex items-center justify-between rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm">
      <div className="flex flex-col">
        <span className="font-medium">Prévisualisation de la voix</span>
        <span className="text-xs text-gray-500">
          {name || "Ava"} · {voice || "voix non définie"} · {language}
        </span>
      </div>
      <button
        type="button"
        onClick={onPreviewRequested}
        className="rounded bg-white px-3 py-1 text-sm font-medium shadow-sm ring-1 ring-gray-300 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Lecture..." : "Écouter"}
      </button>
    </div>
  );
}
