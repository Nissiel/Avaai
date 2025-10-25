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

export async function listAssistants(): Promise<AssistantsResult> {
  try {
    const response = await fetch("/api/vapi/assistants", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const text = await response.text();
    let payload: AssistantListApiPayload | null = null;

    if (text) {
      try {
        payload = JSON.parse(text) as AssistantListApiPayload;
      } catch (parseError) {
        console.warn("[assistants] unable to parse response payload:", parseError);
        return {
          assistants: [],
          warning: {
            code: "PARSE_FAILED",
            message:
              parseError instanceof Error
                ? parseError.message
                : "Malformed assistants payload.",
          },
        };
      }
    }

    if (!response.ok) {
      const code: AssistantsWarningCode =
        response.status === 503 ? "NOT_CONFIGURED" : "FETCH_FAILED";
      const message =
        payload?.error ??
        (code === "NOT_CONFIGURED"
          ? "Vapi client not configured. Add a valid VAPI_API_KEY."
          : `Failed to load assistants (status ${response.status}).`);
      console.warn("[assistants] backend returned non-OK status:", message);
      return {
        assistants: payload?.assistants ?? [],
        warning: {
          code,
          message,
        },
        configured: payload?.configured,
      };
    }

    if (!payload) {
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

    if (payload.success === false) {
      const message = payload.error ?? "Assistants service responded with success=false.";
      console.warn("[assistants] fetch success flag false:", message);
      return {
        assistants: payload.assistants ?? [],
        warning: {
          code: "FETCH_FAILED",
          message,
        },
        configured: payload.configured,
      };
    }

    return {
      assistants: payload.assistants ?? [],
      configured: payload.configured,
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
  const response = await fetch("/api/vapi/assistants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? "Failed to create assistant");
  }

  const data = (await response.json()) as AssistantResponse;
  if (!data.success || !data.assistant) {
    throw new Error("Assistant creation response malformed");
  }

  return data.assistant;
}

export async function getAssistantDetail(id: string) {
  const response = await fetch(`/api/vapi/assistants?id=${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assistant ${id} (status: ${response.status})`);
  }

  const payload = (await response.json()) as AssistantDetailResponse;
  if (!payload.success || !payload.assistant) {
    throw new Error("Assistant detail malformed");
  }

  return payload.assistant;
}

export async function updateAssistant(payload: UpdateAssistantPayload) {
  const response = await fetch("/api/vapi/assistants", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? `Failed to update assistant ${payload.id}`);
  }

  const data = (await response.json()) as AssistantDetailResponse;
  if (!data.success || !data.assistant) {
    throw new Error("Assistant update response malformed");
  }

  return data.assistant;
}
