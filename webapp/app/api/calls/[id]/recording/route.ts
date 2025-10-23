import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const response = await fetch(`${BACKEND_URL}/api/v1/calls/${params.id}/recording`, { cache: "no-store" });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
