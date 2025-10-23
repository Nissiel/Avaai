import type { Session } from "next-auth";

export async function getCurrentSession(): Promise<Session | null> {
  // TODO: Hook into next-auth once auth routes are implemented.
  return null;
}
