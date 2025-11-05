/**
 * Phone Numbers API Service
 * 
 * Provides methods to interact with the backend phone numbers API.
 * Handles US number creation via Vapi and Twilio number import.
 */

import { getAuthHeaders } from "@/lib/api/auth-helper";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.APP_BACKEND_URL ??
  process.env.NEXT_PUBLIC_APP_BACKEND_URL ??
  "http://localhost:8000";

const PUBLIC_JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Response from Vapi/Twilio phone number creation/import
 */
export interface PhoneNumberResponse {
  success: boolean;
  phone: {
    id: string;
    number: string; // E.164 format: +33612345678
    provider: "VAPI" | "VAPI_TWILIO" | "TWILIO";
    assistantId?: string;
  };
  message: string;
}

/**
 * Response from Twilio credentials verification
 */
export interface TwilioVerifyResponse {
  valid: boolean;
  number?: string;
  country?: string;
  error?: string;
}

/**
 * Create a free US phone number via Vapi
 * 
 * @param assistantId - The assistant ID to link the number to
 * @param orgId - The organization ID
 * @param areaCode - Optional area code (e.g., "415" for San Francisco)
 * @returns Phone number details
 * @throws Error if creation fails or limit reached (max 10 free numbers)
 */
export async function createUSNumber(
  assistantId: string,
  orgId: string,
  areaCode?: string
): Promise<PhoneNumberResponse> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/phone-numbers/create-us`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        assistant_id: assistantId,
        org_id: orgId,
        area_code: areaCode,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        errorPayload.detail ?? 
        `Failed to create US number (status ${response.status})`
      );
    }

    return response.json();
  } catch (error) {
    console.error("❌ Error creating US number:", error);
    throw error;
  }
}

/**
 * Import a Twilio phone number into Vapi
 * 
 * For international numbers (France, Israel, etc.) or when you already
 * have a Twilio number you want to use with Vapi.
 * 
 * @param twilioAccountSid - Twilio Account SID (starts with AC...)
 * @param twilioAuthToken - Twilio Auth Token
 * @param phoneNumber - Phone number in E.164 format (+33612345678)
 * @param assistantId - The assistant ID to link the number to
 * @param orgId - The organization ID
 * @returns Phone number details
 * @throws Error if import fails or credentials invalid
 */
export async function importTwilioNumber(
  twilioAccountSid: string,
  twilioAuthToken: string,
  phoneNumber: string,
  assistantId: string,
  orgId: string
): Promise<PhoneNumberResponse> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/phone-numbers/import-twilio`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        twilio_account_sid: twilioAccountSid,
        twilio_auth_token: twilioAuthToken,
        phone_number: phoneNumber,
        assistant_id: assistantId ?? undefined,
        org_id: orgId,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        errorPayload.detail ?? 
        `Failed to import Twilio number (status ${response.status})`
      );
    }

    return response.json();
  } catch (error) {
    console.error("❌ Error importing Twilio number:", error);
    throw error;
  }
}

/**
 * Verify Twilio credentials and check if a phone number exists
 * 
 * Use this before importing to validate credentials and number ownership.
 * 
 * @param accountSid - Twilio Account SID
 * @param authToken - Twilio Auth Token
 * @param phoneNumber - Phone number in E.164 format
 * @returns Verification result with number details if valid
 */
export async function verifyTwilioCredentials(
  accountSid: string,
  authToken: string,
  phoneNumber: string
): Promise<TwilioVerifyResponse> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/phone-numbers/twilio/verify`, {
      method: "POST",
      headers: PUBLIC_JSON_HEADERS,
      body: JSON.stringify({
        account_sid: accountSid,
        auth_token: authToken,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        errorPayload.detail ?? 
        `Failed to verify Twilio credentials (status ${response.status})`
      );
    }

    return response.json();
  } catch (error) {
    console.error("❌ Error verifying Twilio credentials:", error);
    throw error;
  }
}

/**
 * Get all phone numbers for an organization
 * 
 * @param orgId - The organization ID
 * @returns List of phone numbers
 */
export async function getPhoneNumbers(orgId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/v1/phone-numbers/my-numbers?org_id=${orgId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        errorPayload.detail ?? 
        `Failed to fetch phone numbers (status ${response.status})`
      );
    }

    return response.json();
  } catch (error) {
    console.error("❌ Error fetching phone numbers:", error);
    throw error;
  }
}
