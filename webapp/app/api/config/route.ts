import { NextRequest, NextResponse } from "next/server";

import { fetchStudioConfig, updateStudioConfig } from "@/services/config-service";
import { studioConfigUpdateSchema } from "@/lib/validations/config";

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const config = await fetchStudioConfig(token);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to read studio configuration:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const payload = await request.json();
    const parsed = studioConfigUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid configuration payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await updateStudioConfig(parsed.data, token);
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("Failed to persist studio configuration:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 502 },
    );
  }
}
