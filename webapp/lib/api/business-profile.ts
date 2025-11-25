/**
 * Business Profile API client
 */

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  description: string | null;
  services: string[];
  target_market: string | null;
  value_proposition: string | null;
}

export interface BusinessProfileUpdate {
  company_name?: string | null;
  website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  description?: string | null;
  services?: string[];
  target_market?: string | null;
  value_proposition?: string | null;
}

/**
 * Get the current user's business profile
 */
export async function getBusinessProfile(): Promise<BusinessProfile> {
  const response = await fetch('/api/business-profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch business profile');
  }

  return response.json();
}

/**
 * Update the current user's business profile
 */
export async function updateBusinessProfile(
  data: BusinessProfileUpdate
): Promise<BusinessProfile> {
  const response = await fetch('/api/business-profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update business profile');
  }

  return response.json();
}
