import { apiFetch } from "@/lib/api/client";
import { safeJsonParse } from "@/lib/utils/safe-json";

export type RemoteVapiSetting = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

type RemoteListPayload =
  | { settings?: RemoteVapiSetting[] }
  | RemoteVapiSetting[]
  | null;

function normalizeSetting(payload: any): RemoteVapiSetting {
  if (!payload || typeof payload !== "object") {
    return { key: String(payload ?? ""), value: payload, updated_at: null };
  }

  return {
    key: String(payload.key ?? payload.id ?? ""),
    value: payload.value,
    updated_at: payload.updated_at ?? payload.updatedAt ?? null,
  };
}

async function parseJson(response: Response, context: string) {
  const raw = await response.text();
  return (
    safeJsonParse<any>(raw, {
      fallback: {},
      context,
      onError: (_, text) => ({ detail: text.slice(0, 512) }),
    }) ?? {}
  );
}

export async function listRemoteVapiSettings(): Promise<RemoteVapiSetting[]> {
  const response = await apiFetch("/api/vapi-remote-settings", {
    baseUrl: "relative",
    timeoutMs: 10_000,
    metricsLabel: "vapi.remote.list",
  });

  const payload = (await parseJson(response, "vapi.remote.list")) as RemoteListPayload & { detail?: string };

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Unable to load Vapi settings");
  }

  if (Array.isArray(payload)) {
    return payload.map(normalizeSetting);
  }
  if (payload?.settings && Array.isArray(payload.settings)) {
    return payload.settings.map(normalizeSetting);
  }

  return [];
}

export async function updateRemoteVapiSetting(key: string, value: unknown): Promise<RemoteVapiSetting> {
  const response = await apiFetch(`/api/vapi-remote-settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    baseUrl: "relative",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }),
    timeoutMs: 10_000,
    metricsLabel: "vapi.remote.update",
  });

  const payload = (await parseJson(response, "vapi.remote.update")) as {
    setting?: RemoteVapiSetting;
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Unable to update Vapi setting");
  }

  return normalizeSetting(payload?.setting ?? payload);
}
