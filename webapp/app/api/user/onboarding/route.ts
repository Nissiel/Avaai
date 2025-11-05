import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * PATCH /api/user/onboarding
 * Update onboarding flags for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const headerToken = request.headers.get("authorization");
    const bearerToken = headerToken?.startsWith("Bearer ")
      ? headerToken
      : null;
    const cookieToken = request.cookies.get("access_token")?.value;
    const token = bearerToken ?? (cookieToken ? `Bearer ${cookieToken}` : null);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${API_URL}/api/v1/user/onboarding`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update onboarding flags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
