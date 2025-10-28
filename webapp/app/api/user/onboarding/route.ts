import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/user/onboarding
 * Update onboarding flags for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = request.headers.get("Authorization");
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      onboarding_vapi_skipped, 
      onboarding_twilio_skipped, 
      onboarding_assistant_created 
    } = body;

    // Forward to backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/onboarding`;
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: session,
      },
      body: JSON.stringify({
        onboarding_vapi_skipped,
        onboarding_twilio_skipped,
        onboarding_assistant_created,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update onboarding flags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
