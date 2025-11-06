import { NextRequest } from "next/server";

/**
 * Extract the bearer token from either the Authorization header or the
 * httpOnly `access_token` cookie so we can forward auth to the backend.
 */
export function getRequestAccessToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return request.cookies.get("access_token")?.value ?? undefined;
}
