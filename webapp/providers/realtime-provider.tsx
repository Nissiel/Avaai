import { useMemo } from "react";

import { RealtimeEvent } from "@/lib/realtime/events";
import { useRealtime } from "@/lib/realtime/use-realtime";
import { useAssistantsStore } from "@/stores/assistants-store";
import { useCallsStore } from "@/stores/calls-store";
import { useCallTranscriptsStore } from "@/stores/call-transcripts-store";

interface RealtimeProviderProps {
  children: React.ReactNode;
  url?: string;
}

export function RealtimeProvider({ children, url = process.env.NEXT_PUBLIC_REALTIME_URL }: RealtimeProviderProps) {
  const prependCall = useCallsStore((state) => state.prependCall);
  const upsertCall = useCallsStore((state) => state.upsertCall);
  const upsertAssistant = useAssistantsStore((state) => state.upsertAssistant);
  const appendTranscript = useCallTranscriptsStore((state) => state.appendChunk);

  if (!url) {
    return <>{children}</>;
  }

  const handler = useMemo(
    () =>
      (event: RealtimeEvent) => {
        switch (event.type) {
          case "CALL_STARTED":
            prependCall({
              id: event.payload.callId,
              assistantId: event.payload.assistantId,
              startedAt: event.payload.startedAt,
              status: "in-progress",
            });
            break;
          case "CALL_UPDATED":
            {
              const existing = useCallsStore.getState().calls.find((call) => call.id === event.payload.callId);
            upsertCall({
              id: event.payload.callId,
              assistantId: existing?.assistantId ?? event.payload.callId,
              customerNumber: existing?.customerNumber,
              startedAt: existing?.startedAt,
              status: event.payload.status,
              durationSeconds: event.payload.durationSeconds,
            });
            }
            break;
          case "CALL_ENDED":
            {
              const existing = useCallsStore.getState().calls.find((call) => call.id === event.payload.callId);
            upsertCall({
              id: event.payload.callId,
              assistantId: existing?.assistantId ?? event.payload.callId,
              customerNumber: existing?.customerNumber,
              startedAt: existing?.startedAt,
              endedAt: event.payload.endedAt,
              status: "ended",
              transcriptPreview: event.payload.transcript,
              transcript: event.payload.transcript,
            });
            }
            break;
          case "TRANSCRIPT_CHUNK":
            appendTranscript(event.payload.callId, {
              id: `${event.timestamp}-${event.payload.callId}`,
              callId: event.payload.callId,
              role: event.payload.role,
              text: event.payload.text,
              timestamp: event.timestamp,
            });
            break;
          case "FUNCTION_EXECUTED":
            break;
          case "ASSISTANT_STATUS_CHANGED":
            upsertAssistant({
              id: event.payload.assistantId,
              name: event.payload.assistantId,
              phoneNumber: undefined,
              createdAt: undefined,
              voice: undefined,
            });
            break;
        }
      },
    [appendTranscript, prependCall, upsertAssistant, upsertCall],
  );

  useRealtime({ url, onEvent: handler, autoReconnect: true });

  return <>{children}</>;
}
