"use server";

import { cookies } from "next/headers";

import { serverFetchBackend } from "@/lib/http/server-client";

export type RemoteVapiSetting = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

type UpdateResult =
  | { success: true; setting: RemoteVapiSetting }
  | { success: false; error: string };

function requireAuthToken(): string {
  const token = cookies().get("access_token")?.value;
  if (!token) {
    throw new Error("Authentication required");
  }
  return token;
}

async function parseResponse(response: Response): Promise<any> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { detail: raw.slice(0, 512) };
  }
}

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

export async function listVapiRemoteSettingsAction(): Promise<RemoteVapiSetting[]> {
  const token = requireAuthToken();
  const response = await serverFetchBackend("/api/v1/vapi/settings", {
    method: "GET",
    authToken: token,
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    throw new Error(body.detail ?? "Unable to load Vapi settings");
  }

  if (Array.isArray(body)) {
    return body.map(normalizeSetting);
  }
  if (Array.isArray(body?.settings)) {
    return body.settings.map(normalizeSetting);
  }
  return [];
}

function coerceValue(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

export async function updateVapiRemoteSettingAction(payload: { key: string; value: string }): Promise<UpdateResult> {
  const token = requireAuthToken();
  const response = await serverFetchBackend(`/api/v1/vapi/settings/${encodeURIComponent(payload.key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: coerceValue(payload.value) }),
    authToken: token,
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    return {
      success: false,
      error: body.detail ?? "Unable to update Vapi setting",
    };
  }

  const settingPayload = body.setting ?? body;
  return {
    success: true,
    setting: normalizeSetting(settingPayload),
  };
}
