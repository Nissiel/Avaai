import { z } from "zod";

import type { CallDetail, CallListResponse, CallSummary } from "@/lib/dto";
import { apiFetch } from "@/lib/api/client";

const CallSummaryApiSchema = z.object({
  id: z.string(),
  assistantId: z.string(),
  customerNumber: z.string().nullish(),
  status: z.string(),
  startedAt: z.string().nullish(),
  endedAt: z.string().nullish(),
  durationSeconds: z.number().nullish(),
  cost: z.number().nullish(),
  transcriptPreview: z.string().nullish(),
  sentiment: z.number().nullish().optional(),
});

const CallDetailApiSchema = CallSummaryApiSchema.extend({
  transcript: z.string().nullish(),
  metadata: z.record(z.any()).nullish(),
  recordingUrl: z.string().nullish(),
});

type CallSummaryApi = z.infer<typeof CallSummaryApiSchema>;
type CallDetailApi = z.infer<typeof CallDetailApiSchema>;

function mapCallSummary(payload: CallSummaryApi): CallSummary {
  return {
    id: payload.id,
    assistantId: payload.assistantId,
    customerNumber: payload.customerNumber ?? undefined,
    status: payload.status,
    startedAt: payload.startedAt ?? undefined,
    endedAt: payload.endedAt ?? undefined,
    durationSeconds: payload.durationSeconds ?? undefined,
    cost: payload.cost ?? undefined,
    transcriptPreview: payload.transcriptPreview ?? undefined,
    sentiment: payload.sentiment ?? undefined,
  };
}

function mapCallDetail(payload: CallDetailApi): CallDetail {
  return {
    ...mapCallSummary(payload),
    transcript: payload.transcript ?? undefined,
    metadata: payload.metadata ?? undefined,
    recordingUrl: payload.recordingUrl ?? undefined,
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

export interface SendTranscriptEmailResponse {
  status: string;
  message: string;
  email_id: string;
}

/**
 * Send call transcript via email to the authenticated user
 * 
 * @param callId - The ID of the call
 * @returns Promise resolving to email send result
 */
export async function sendCallTranscriptEmail(callId: string): Promise<SendTranscriptEmailResponse> {
  const res = await apiFetch(`/api/analytics/calls/${encodeURIComponent(callId)}/email`, {
    method: "POST",
    auth: true,
    dedupeKey: `email-${callId}`,
    baseUrl: "relative",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to send email" }));
    throw new Error(error.detail || `Failed to send transcript email`);
  }

  return res.json();
}

export async function deleteCall(callId: string): Promise<void> {
  // 🔥 DIVINE: Add credentials to ensure cookies are sent
  console.log("🗑️ DELETE CALL REQUEST:", { callId });
  const res = await fetch(`/api/calls/${callId}`, { 
    method: "DELETE",
    credentials: "include", // 🔥 DIVINE: Ensure cookies are sent
  });
  
  console.log("🗑️ DELETE CALL RESPONSE:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });
  
  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({ detail: "Failed to delete call" }));
    console.error("🗑️ DELETE CALL ERROR:", error);
    throw new Error(error.detail || `Failed to delete call`);
  }
  
  console.log("🗑️ DELETE CALL SUCCESS");
}
