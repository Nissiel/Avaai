export interface CallSummary {
  id: string;
  assistantId: string;
  customerNumber?: string | null;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  cost?: number | null;
  transcriptPreview?: string | null;
  transcript?: string | null;
  sentiment?: number | null;
}

export interface CallDetail extends CallSummary {
  transcript?: string | null;
  metadata?: Record<string, unknown> | null;
  recordingUrl?: string | null;
}

export interface CallListResponse {
  calls: CallSummary[];
  total: number;
}

export interface TranscriptChunk {
  id: string;
  callId: string;
  role: "assistant" | "customer";
  text: string;
  timestamp: string;
}
