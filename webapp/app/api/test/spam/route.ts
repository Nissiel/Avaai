import { NextResponse } from "next/server";

let hitCount = 0;

export async function POST() {
  hitCount += 1;
  await new Promise((resolve) => setTimeout(resolve, 100)); // simulate latency
  return NextResponse.json({ status: "ok", hits: hitCount });
}

export async function GET() {
  return NextResponse.json({ hits: hitCount });
}
