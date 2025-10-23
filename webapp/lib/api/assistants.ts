import type {
  AssistantDetail,
  AssistantDetailResponse,
  AssistantListResponse,
  AssistantResponse,
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "@/lib/dto";

export async function listAssistants() {
  const response = await fetch("/api/vapi/assistants", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assistants (status: ${response.status})`);
  }

  const payload = (await response.json()) as AssistantListResponse;
  if (!payload.success) {
    throw new Error("Unable to load assistants");
  }

  return payload.assistants ?? [];
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
