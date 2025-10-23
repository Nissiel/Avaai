import { z } from "zod";

import type { CallDetail, CallListResponse, CallSummary } from "@/lib/dto";

const CallSummaryApiSchema = z.object({
  id: z.string(),
  assistant_id: z.string(),
  customer_number: z.string().nullish(),
  status: z.string(),
  started_at: z.string().nullish(),
  ended_at: z.string().nullish(),
  duration_seconds: z.number().nullish(),
  cost: z.number().nullish(),
  transcript_preview: z.string().nullish(),
  sentiment: z.number().nullish().optional(),
});

const CallDetailApiSchema = CallSummaryApiSchema.extend({
  transcript: z.string().nullish(),
  metadata: z.record(z.any()).nullish(),
  recording_url: z.string().nullish(),
});

type CallSummaryApi = z.infer<typeof CallSummaryApiSchema>;
type CallDetailApi = z.infer<typeof CallDetailApiSchema>;

function mapCallSummary(payload: CallSummaryApi): CallSummary {
  return {
    id: payload.id,
    assistantId: payload.assistant_id,
    customerNumber: payload.customer_number ?? undefined,
    status: payload.status,
    startedAt: payload.started_at ?? undefined,
    endedAt: payload.ended_at ?? undefined,
    durationSeconds: payload.duration_seconds ?? undefined,
    cost: payload.cost ?? undefined,
    transcriptPreview: payload.transcript_preview ?? undefined,
    sentiment: payload.sentiment ?? undefined,
  };
}

function mapCallDetail(payload: CallDetailApi): CallDetail {
  return {
    ...mapCallSummary(payload),
    transcript: payload.transcript ?? undefined,
    metadata: payload.metadata ?? undefined,
    recordingUrl: payload.recording_url ?? undefined,
  };
}

export async function listCalls(params: { limit?: number; status?: string } = {}): Promise<CallListResponse> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", params.limit.toString());
  if (params.status) search.set("status", params.status);

  const res = await fetch(`/api/calls${search.toString() ? `?${search.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch calls");

  const data = await res.json();
  const parsed = z
    .object({
      calls: z.array(CallSummaryApiSchema).default([]),
      total: z.number().optional(),
    })
    .parse(data);

  const mappedCalls = parsed.calls.map(mapCallSummary);
  return {
    calls: mappedCalls,
    total: parsed.total ?? mappedCalls.length,
  };
}

export async function getCall(callId: string): Promise<CallDetail> {
  const res = await fetch(`/api/calls/${callId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch call detail");
  const data = await res.json();
  const parsed = CallDetailApiSchema.parse(data);
  return mapCallDetail(parsed);
}

export async function getCallRecording(callId: string): Promise<{ recordingUrl: string }> {
  const res = await fetch(`/api/calls/${callId}/recording`, { cache: "no-store" });
  if (!res.ok) throw new Error("Recording not available");
  const data = await res.json();
  const schema = z.object({ recording_url: z.string() });
  const parsed = schema.parse(data);
  return { recordingUrl: parsed.recording_url };
}
