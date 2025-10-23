import { NextRequest, NextResponse } from "next/server";

import {
  backendConfig,
  controlBackendRuntime,
  getBackendRuntimeStatus,
} from "@/services/backend-service";

const actionSchema = new Set(["start", "stop", "restart"]);

type BackendAction = "start" | "stop" | "restart";

export async function GET() {
  const status = await getBackendRuntimeStatus();

  return NextResponse.json({
    success: status.ok,
    status: status.status,
    url: status.url,
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const action = payload.action as BackendAction | undefined;

    if (!action || !actionSchema.has(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid runtime action" },
        { status: 400 },
      );
    }

    const result = await controlBackendRuntime(action);
    return NextResponse.json({
      success: true,
      action,
      backend: backendConfig.baseUrl,
      result,
    });
  } catch (error) {
    console.error("Backend control error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to control backend runtime" },
      { status: 502 },
    );
  }
}
