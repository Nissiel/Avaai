import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return request.cookies.get("access_token")?.value ?? undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = getToken(request);
  const response = await fetch(`${BACKEND_URL}/api/v1/calls/${params.id}/recording`, {
    cache: "no-store",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
