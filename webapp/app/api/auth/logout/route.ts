import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookies
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  
  return response;
}
