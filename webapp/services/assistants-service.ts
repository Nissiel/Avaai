/**
 * Assistants Service
 * 
 * API service for managing Vapi AI assistants.
 * Assistants define voice, personality, and conversation flow.
 */

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.APP_BACKEND_URL ??
  process.env.NEXT_PUBLIC_APP_BACKEND_URL ??
  "http://localhost:8000";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Request body for creating a new assistant
 */
export interface CreateAssistantRequest {
  name: string;                    // Assistant name (max 40 chars)
  voice_provider: string;          // "11labs", "azure", "deepgram", etc.
  voice_id: string;                // Voice ID from provider
  first_message: string;           // Greeting when call starts
  model_provider?: string;         // LLM provider (default: "openai")
  model?: string;                  // Model name (default: "gpt-3.5-turbo")
  temperature?: number;            // 0.0-1.0 creativity (default: 0.7)
  max_tokens?: number;             // Max response length (default: 250)
  metadata?: Record<string, any>; // Optional metadata
}

/**
 * Assistant response from Vapi
 */
export interface Assistant {
  id: string;                      // UUID - use this for phone numbers!
  name: string;
  voice: {
    provider: string;
    voiceId: string;
  };
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  firstMessage: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new AI assistant
 * 
 * @example
 * ```ts
 * const assistant = await createAssistant({
 *   name: "AVA - Sarah's Real Estate Assistant",
 *   voice_provider: "11labs",
 *   voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
 *   first_message: "Hi! I'm AVA, Sarah's assistant. How can I help you?",
 *   metadata: { industry: "real_estate", user_id: "123" }
 * });
 * // Use assistant.id for phone number setup
 * ```
 */
export async function createAssistant(
  data: CreateAssistantRequest
): Promise<Assistant> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/assistants/create`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.assistant;
  } catch (error: any) {
    console.error("createAssistant error:", error);
    throw error;
  }
}

/**
 * List all assistants
 */
export async function listAssistants(
  limit: number = 50
): Promise<Assistant[]> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/assistants?limit=${limit}`, {
      method: "GET",
      headers: JSON_HEADERS,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.assistants;
  } catch (error: any) {
    console.error("listAssistants error:", error);
    throw error;
  }
}

/**
 * Get a specific assistant by ID
 */
export async function getAssistant(
  assistantId: string
): Promise<Assistant> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/assistants/${assistantId}`, {
      method: "GET",
      headers: JSON_HEADERS,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.assistant;
  } catch (error: any) {
    console.error("getAssistant error:", error);
    throw error;
  }
}
