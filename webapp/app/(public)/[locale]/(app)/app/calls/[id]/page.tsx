'use client';

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Bot, Clock, DollarSign, User } from "lucide-react";

import { getCall } from "@/lib/api/calls";
import type { CallDetail } from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { FuturisticButton } from "@/components/ui/futuristic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallsStore } from "@/stores/calls-store";
import { useCallTranscriptsStore } from "@/stores/call-transcripts-store";

export default function CallDetailPage() {
  const params = useParams();
  const callId = params?.id as string;

  const realtimeCall = useCallsStore((state) => state.calls.find((item) => item.id === callId));
  const setBaseTranscript = useCallTranscriptsStore((state) => state.setBase);
  const clearTranscript = useCallTranscriptsStore((state) => state.clear);
  const baseTranscriptFromStore = useCallTranscriptsStore((state) => state.base[callId]);
  const transcriptChunks = useCallTranscriptsStore((state) => state.chunks[callId] ?? []);

  const { data: call, isLoading } = useQuery({
    queryKey: ["call", callId],
    queryFn: () => getCall(callId),
    enabled: Boolean(callId),
  });

  useEffect(() => {
    if (callId && call?.transcript && !baseTranscriptFromStore) {
      setBaseTranscript(callId, call.transcript);
    }
  }, [baseTranscriptFromStore, call?.transcript, callId, setBaseTranscript]);

  useEffect(
    () => () => {
      if (callId) {
        clearTranscript(callId);
      }
    },
    [callId, clearTranscript],
  );

  const mergedCall = useMemo<CallDetail | undefined>(() => {
    if (!call && !realtimeCall) return undefined;
    if (!call) return realtimeCall as CallDetail | undefined;
    if (!realtimeCall) return call;
    return { ...call, ...realtimeCall };
  }, [call, realtimeCall]);

  if (isLoading && !mergedCall) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <GlassCard className="min-h-[320px]">
          <Skeleton className="h-full w-full" />
        </GlassCard>
      </div>
    );
  }

  if (!mergedCall) {
    return <div className="py-12 text-center text-muted-foreground">Appel introuvable</div>;
  }

  const startedAt = mergedCall.startedAt
    ? format(parseISO(mergedCall.startedAt), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })
    : "—";
  const duration = mergedCall.durationSeconds
    ? `${Math.floor(mergedCall.durationSeconds / 60)}min ${mergedCall.durationSeconds % 60}s`
    : "—";
  const cost = mergedCall.cost ? `${mergedCall.cost.toFixed(4)}€` : "—";

  const baseTranscript = baseTranscriptFromStore ?? mergedCall.transcript ?? "";
  const badgeVariant =
    mergedCall.status === "ended"
      ? "success"
      : mergedCall.status === "in-progress"
      ? "warning"
      : "danger";

  const hasStreaming = transcriptChunks.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Appel {mergedCall.customerNumber ?? "inconnu"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {startedAt}
            </span>
            <span>{duration}</span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {cost}
            </span>
          </div>
        </div>
        <Badge variant={badgeVariant}>{mergedCall.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transcription</h2>
              <FuturisticButton size="sm" variant="ghost">
                Exporter
              </FuturisticButton>
            </div>
            <div className="max-h-[520px] overflow-y-auto rounded-2xl bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground space-y-4">
              {baseTranscript ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                  {baseTranscript}
                </pre>
              ) : (
                <p>Cette conversation n&apos;a pas encore été transcrite.</p>
              )}

              {hasStreaming ? (
                <div className="space-y-3">
                  {transcriptChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className={`flex items-start gap-3 rounded-2xl p-3 ${
                        chunk.role === "assistant"
                          ? "bg-primary/10 text-primary-foreground/80"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="rounded-full bg-background/80 p-2 text-muted-foreground">
                        {chunk.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                          {chunk.role === "assistant" ? "AVA" : "Client"}
                        </p>
                        <p className="text-sm text-foreground/90">{chunk.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </GlassCard>

          {mergedCall.recordingUrl ? (
            <GlassCard className="space-y-4">
              <h2 className="text-lg font-semibold">Enregistrement audio</h2>
              <audio controls className="w-full">
                <source src={mergedCall.recordingUrl} type="audio/mpeg" />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </GlassCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <h2 className="text-lg font-semibold">Informations</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Identifiant</dt>
                <dd className="break-all font-mono text-xs text-muted-foreground/90">{mergedCall.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assistant</dt>
                <dd className="break-all font-mono text-xs text-muted-foreground/90">{mergedCall.assistantId}</dd>
              </div>
            </dl>
          </GlassCard>

          {mergedCall.metadata ? (
            <GlassCard className="space-y-4">
              <h2 className="text-lg font-semibold">Métadonnées</h2>
              <pre className="max-h-64 overflow-y-auto rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">
                {JSON.stringify(mergedCall.metadata, null, 2)}
              </pre>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
