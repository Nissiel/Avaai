import { apiFetch } from "@/lib/api/client";
import type {
  AssistantDetail,
  AssistantDetailResponse,
  AssistantListResponse,
  AssistantResponse,
  AssistantSummary,
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "@/lib/dto";

type AssistantListApiPayload = AssistantListResponse & {
  error?: string;
  configured?: boolean;
  success?: boolean;
};

export type AssistantsWarningCode =
  | "NOT_CONFIGURED"
  | "FETCH_FAILED"
  | "PARSE_FAILED"
  | "EMPTY_RESPONSE";

export interface AssistantsWarning {
  code: AssistantsWarningCode;
  message?: string;
}

export interface AssistantsResult {
  assistants: AssistantSummary[];
  warning?: AssistantsWarning;
  configured?: boolean;
}

// 🔥 DIVINE FIX: Use frontend proxy route instead of direct backend path
// Frontend has /api/assistants proxy → Backend /api/v1/assistants
const BASE_PATH = "/api/assistants";

interface BackendResponse<T> {
  response: Response;
  data: T | null;
  raw: string | null;
}

async function backendRequest<T>(
  path: string,
  init: RequestInit & { metricsLabel: string; timeoutMs?: number },
): Promise<BackendResponse<T>> {
  const { metricsLabel, timeoutMs = 12_000, ...fetchInit } = init;
  const response = await apiFetch(path, {
    ...fetchInit,
    metricsLabel,
    timeoutMs,
    baseUrl: "relative", // 🔥 DIVINE FIX: Use relative for frontend proxy routes
  });

  const raw = await response.text();
  let data: T | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[assistants] failed to parse payload for ${path}`, error);
    }
  }

  return { response, data, raw };
}

export async function listAssistants(): Promise<AssistantsResult> {
  try {
    const { response, data } = await backendRequest<AssistantListApiPayload>(BASE_PATH, {
      method: "GET",
      metricsLabel: "assistants.list",
    });

    if (!response.ok) {
      const code: AssistantsWarningCode =
        response.status === 503 ? "NOT_CONFIGURED" : "FETCH_FAILED";
      const message =
        data?.error ??
        (code === "NOT_CONFIGURED"
          ? "Vapi client not configured. Add a valid VAPI_API_KEY."
          : `Failed to load assistants (status ${response.status}).`);
      console.warn("[assistants] backend returned non-OK status:", message);
      return {
        assistants: data?.assistants ?? [],
        warning: { code, message },
        configured: data?.configured,
      };
    }

    if (!data) {
      console.warn("[assistants] payload empty");
      return {
        assistants: [],
        warning: {
          code: "EMPTY_RESPONSE",
          message: "Assistants response was empty.",
        },
        configured: undefined,
      };
    }

    if (data.success === false) {
      const message = data.error ?? "Assistants service responded with success=false.";
      console.warn("[assistants] fetch success flag false:", message);
      return {
        assistants: data.assistants ?? [],
        warning: {
          code: "FETCH_FAILED",
          message,
        },
        configured: data.configured,
      };
    }

    return {
      assistants: data.assistants ?? [],
      configured: data.configured,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error while loading assistants.";
    console.error("listAssistants error:", error);
    return {
      assistants: [],
      warning: {
        code: "FETCH_FAILED",
        message,
      },
    };
  }
}

export async function createAssistant(payload: CreateAssistantPayload) {
  const { response, data } = await backendRequest<AssistantResponse>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
    metricsLabel: "assistants.create",
    timeoutMs: 15_000,
  });

  if (!response.ok || !data) {
    const errorMessage = ((data as { error?: string } | null)?.error) ?? `Failed to create assistant (${response.status})`;
    throw new Error(errorMessage);
  }

  if (!data.success || !data.assistant) {
    throw new Error("Assistant creation response malformed");
  }

  return data.assistant;
}

export async function getAssistantDetail(id: string) {
  const { response, data } = await backendRequest<AssistantDetailResponse>(
    `${BASE_PATH}/${encodeURIComponent(id)}`,
    {
      method: "GET",
      metricsLabel: "assistants.detail",
    },
  );

  if (!response.ok || !data) {
    throw new Error(`Failed to fetch assistant ${id} (status: ${response.status})`);
  }

  if (!data.success || !data.assistant) {
    throw new Error("Assistant detail malformed");
  }

  return data.assistant;
}

export async function updateAssistant(payload: UpdateAssistantPayload) {
  const { response, data } = await backendRequest<AssistantDetailResponse>(
    `${BASE_PATH}/${encodeURIComponent(payload.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      metricsLabel: "assistants.update",
      timeoutMs: 15_000,
    },
  );

  if (!response.ok || !data) {
    const errorPayload = (data as { error?: string } | null)?.error;
    throw new Error(errorPayload ?? `Failed to update assistant ${payload.id}`);
  }

  if (!data.success || !data.assistant) {
    throw new Error("Assistant update response malformed");
  }

  return data.assistant;
}
