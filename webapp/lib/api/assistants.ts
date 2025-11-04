import type {
  AssistantDetail,
  AssistantDetailResponse,
  AssistantListResponse,
  AssistantResponse,
  AssistantSummary,
  CreateAssistantPayload,
  TwilioLinkResult,
  UpdateAssistantPayload,
} from "@/lib/dto";
import { getAuthHeaders } from "./auth-helper";
import { refreshAccessToken } from "@/lib/auth/session-client";

/**
 * 🎯 DIVINE: Get backend API base URL
 */
function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

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
    // 🎯 DIVINE: Call Python backend with user's Vapi key (multi-tenant)
    const response = await fetch(`${getBackendUrl()}/api/v1/assistants`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    // 🎯 DIVINE: If 401, try to refresh token automatically
    if (response.status === 401) {
      console.log("⚠️ 401 Unauthorized - Attempting token refresh...");
      
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        
        if (newAccessToken) {
          console.log("✅ Token refreshed! Retrying listAssistants...");
          
          // Retry the request with new token
          const retryResponse = await fetch(`${getBackendUrl()}/api/v1/assistants`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
          
          if (retryResponse.ok) {
            const payload = await retryResponse.json() as AssistantListApiPayload;
            return {
              assistants: payload.assistants ?? [],
              configured: payload.configured,
            };
          }
        }
      }
      
      // If we get here, refresh failed
      console.error("❌ Token refresh failed - redirecting to login");
      return {
        assistants: [],
        warning: {
          code: "FETCH_FAILED",
          message: "Session expired. Please login again.",
        },
      };
    }

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

export interface CreateAssistantResult {
  assistant: AssistantSummary;
  twilioLink?: TwilioLinkResult | null;
}

export async function createAssistant(payload: CreateAssistantPayload): Promise<CreateAssistantResult> {
  // 🎯 DIVINE: Call Python backend with user's Vapi key (multi-tenant)
  const response = await fetch(`${getBackendUrl()}/api/v1/assistants`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // 🎯 DIVINE: If 401, try to refresh token automatically
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");
    
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      
      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying createAssistant...");
        
        // Retry the request with new token
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/assistants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (retryResponse.ok) {
          const data = (await retryResponse.json()) as AssistantResponse;
          if (!data.success || !data.assistant) {
            throw new Error("Assistant creation response malformed");
          }
          return {
            assistant: data.assistant,
            twilioLink: data.twilio_link ?? null,
          };
        }
      }
    }
    
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? "Failed to create assistant");
  }

  const data = (await response.json()) as AssistantResponse;
  if (!data.success || !data.assistant) {
    throw new Error("Assistant creation response malformed");
  }

  return {
    assistant: data.assistant,
    twilioLink: data.twilio_link ?? null,
  };
}

export async function getAssistantDetail(id: string) {
  // 🎯 DIVINE: Call Python backend with user's Vapi key (multi-tenant)
  const response = await fetch(`${getBackendUrl()}/api/v1/assistants/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  // 🎯 DIVINE: If 401, try to refresh token automatically
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");
    
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      
      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying getAssistantDetail...");
        
        // Retry the request with new token
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/assistants/${encodeURIComponent(id)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
          cache: "no-store",
        });
        
        if (retryResponse.ok) {
          const payload = (await retryResponse.json()) as AssistantDetailResponse;
          if (!payload.success || !payload.assistant) {
            throw new Error("Assistant detail malformed");
          }
          return payload.assistant;
        }
      }
    }
    
    throw new Error("Session expired. Please login again.");
  }

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
  // 🎯 DIVINE: Call Python backend with user's Vapi key (multi-tenant)
  const response = await fetch(`${getBackendUrl()}/api/v1/assistants/${encodeURIComponent(payload.id)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // 🎯 DIVINE: If 401, try to refresh token automatically
  if (response.status === 401) {
    console.log("⚠️ 401 Unauthorized - Attempting token refresh...");
    
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      
      if (newAccessToken) {
        console.log("✅ Token refreshed! Retrying updateAssistant...");
        
        // Retry the request with new token
        const retryResponse = await fetch(`${getBackendUrl()}/api/v1/assistants/${encodeURIComponent(payload.id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (retryResponse.ok) {
          const data = (await retryResponse.json()) as AssistantDetailResponse;
          if (!data.success || !data.assistant) {
            throw new Error("Assistant update response malformed");
          }
          return data.assistant;
        }
      }
    }
    
    throw new Error("Session expired. Please login again.");
  }

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
