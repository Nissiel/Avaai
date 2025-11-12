import { apiFetch } from "@/lib/api/client";

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

async function parseJson(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { detail: raw.slice(0, 512) };
  }
}

export async function listRemoteVapiSettings(): Promise<RemoteVapiSetting[]> {
  const response = await apiFetch("/api/vapi-remote-settings", {
    baseUrl: "relative",
    timeoutMs: 10_000,
    metricsLabel: "vapi.remote.list",
  });

  const payload = (await parseJson(response)) as RemoteListPayload & { detail?: string };

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

  const payload = (await parseJson(response)) as { setting?: RemoteVapiSetting; detail?: string };

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Unable to update Vapi setting");
  }

  return normalizeSetting(payload?.setting ?? payload);
}
