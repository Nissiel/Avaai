import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const backendUrl = `${BACKEND_URL}/api/v1/calls${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(backendUrl, { cache: "no-store" });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
