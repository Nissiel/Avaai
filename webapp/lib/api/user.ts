/**
 * User API Client
 * Handles user profile operations
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  locale: string;
  image: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  phone_verified: boolean;
}

export interface UserUpdatePayload {
  name?: string;
  phone?: string;
  locale?: string;
  image?: string;
}

/**
 * Mark onboarding as completed for the current user
 */
export async function completeOnboarding(): Promise<UserProfile> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarding_completed: true }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to complete onboarding" }));
    throw new Error(error.detail || "Failed to complete onboarding");
  }

  return response.json();
}

/**
 * Update current user profile
 */
export async function updateUserProfile(payload: UserUpdatePayload): Promise<UserProfile> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new Error(error.detail || "Failed to update profile");
  }

  return response.json();
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load user profile (status: ${response.status})`);
  }

  return response.json();
}
