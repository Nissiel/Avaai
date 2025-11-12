/**
 * 🔥 DIVINE CODEX: Twilio Auto-Import Orchestration
 *
 * Frontend orchestrates multi-step flows (UX responsibility)
 * Backend handles data operations (data responsibility)
 *
 * This module provides intelligent auto-import after Twilio credentials are saved.
 *
 * Flow:
 * 1. User saves Twilio credentials
 * 2. Frontend checks prerequisites (Vapi key, assistant, phone number)
 * 3. Frontend auto-calls import endpoint with all required data
 * 4. User gets seamless experience - zero manual work!
 */

import { listAssistants } from "./assistants";
import { getAuthHeaders } from "./auth-helper";
import { getBackendUrl as resolveBackendUrl } from "@/lib/config/env";

/**
 * Prerequisites needed for auto-import
 */
export interface AutoImportPrerequisites {
  hasVapiKey: boolean;
  hasAssistant: boolean;
  assistantId?: string;
  hasPhoneNumber: boolean;
  phoneNumber?: string;
}

/**
 * Result of auto-import attempt
 */
export interface AutoImportResult {
  success: boolean;
  imported: boolean;
  auto_linked?: boolean;  // 🔥 DIVINE: Indicates if number was auto-linked to assistant
  assistant_id?: string;  // 🔥 DIVINE: The assistant ID used
  webhookConfigured?: boolean;
  message: string;
  description?: string;  // 🔥 DIVINE: Additional toast description
  error?: string;
  missingPrerequisites?: string[];
}

/**
 * 🎯 DIVINE: Check if auto-import is possible
 *
 * Checks all prerequisites without making any changes:
 * - User has Vapi API key configured
 * - User has at least one assistant
 * - Phone number is provided
 *
 * @returns Prerequisites status with helpful messages
 */
export async function checkAutoImportPrerequisites(
  phoneNumber?: string
): Promise<AutoImportPrerequisites> {
  // Check if phone number provided
  if (!phoneNumber) {
    return {
      hasVapiKey: false,
      hasAssistant: false,
      hasPhoneNumber: false,
    };
  }

  try {
    // Fetch user's assistants (this checks Vapi key too)
    const result = await listAssistants();

    const hasVapiKey = result.configured === true;
    const hasAssistant = result.assistants.length > 0;
    const assistantId = result.assistants[0]?.id;

    return {
      hasVapiKey,
      hasAssistant,
      assistantId,
      hasPhoneNumber: true,
      phoneNumber,
    };
  } catch (error) {
    console.error("❌ Failed to check prerequisites:", error);
    return {
      hasVapiKey: false,
      hasAssistant: false,
      hasPhoneNumber: !!phoneNumber,
      phoneNumber,
    };
  }
}

/**
 * 🔥 DIVINE: Auto-import Twilio number into Vapi
 *
 * Intelligently handles the complete import flow:
 * 1. Checks prerequisites
 * 2. If all good → Auto-imports
 * 3. If missing → Returns helpful guidance
 *
 * @param twilioAccountSid - Twilio Account SID
 * @param twilioAuthToken - Twilio Auth Token
 * @param phoneNumber - Phone number to import (E.164 format)
 * @returns Result with success status and helpful message
 *
 * @example
 * ```ts
 * const result = await autoImportTwilioNumber(
 *   "ACxxx...",
 *   "token",
 *   "+33612345678"
 * );
 *
 * if (result.imported) {
 *   toast.success(result.message);
 * } else {
 *   toast.info(result.message); // Guide user to next step
 * }
 * ```
 */
export async function autoImportTwilioNumber(
  twilioAccountSid: string,
  twilioAuthToken: string,
  phoneNumber: string
): Promise<AutoImportResult> {
  console.log("🚀 AUTO-IMPORT: Starting Twilio → Vapi orchestration");

  // Step 1: Check prerequisites
  const prereqs = await checkAutoImportPrerequisites(phoneNumber);

  const missing: string[] = [];
  if (!prereqs.hasVapiKey) missing.push("Vapi API key");
  if (!prereqs.hasAssistant) missing.push("Assistant");
  if (!prereqs.hasPhoneNumber) missing.push("Phone number");

  // If prerequisites missing, return guidance
  if (missing.length > 0) {
    console.log("⚠️ AUTO-IMPORT: Prerequisites missing:", missing);

    let message = "To complete setup, please:\n";
    if (!prereqs.hasVapiKey) {
      message += "1. Add your Vapi API key in Settings\n";
    }
    if (!prereqs.hasAssistant) {
      message += "2. Create an assistant\n";
    }

    return {
      success: true, // Credentials saved successfully
      imported: false, // But import not done yet
      message: message.trim(),
      missingPrerequisites: missing,
    };
  }

  // Step 2: All good! Auto-import
  try {
    console.log("✅ AUTO-IMPORT: Prerequisites met, importing...");

    const response = await fetch(
      `${resolveBackendUrl()}/api/v1/phone-numbers/import-twilio`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          twilio_account_sid: twilioAccountSid,
          twilio_auth_token: twilioAuthToken,
          phone_number: phoneNumber,
          assistant_id: prereqs.assistantId ?? undefined,
          org_id: "default", // TODO: Get from user context
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Import failed",
      }));
      throw new Error(error.detail || "Failed to import number");
    }

    const data = await response.json();

    console.log("✅ AUTO-IMPORT: Success!", data);

    // 🔥 DIVINE: Better feedback for auto-linked numbers
    let message = data.message || "✅ Number imported successfully! Ready to receive calls.";
    let description = undefined;

    if (data.auto_linked) {
      message = "✅ Number imported and automatically linked!";
      description = "Your number is ready to receive calls";
    }

    return {
      success: true,
      imported: true,
      auto_linked: data.auto_linked,
      assistant_id: data.assistant_id,
      webhookConfigured: data.webhook_configured,
      message,
      description,
    };
  } catch (error) {
    console.error("❌ AUTO-IMPORT: Failed", error);

    const errorMessage =
      error instanceof Error ? error.message : "Import failed";

    return {
      success: false,
      imported: false,
      error: errorMessage,
      message: `Failed to import number: ${errorMessage}`,
    };
  }
}

/**
 * 🎯 DIVINE: Get user-friendly guidance based on missing prerequisites
 *
 * Provides actionable next steps for users.
 */
export function getAutoImportGuidance(prereqs: AutoImportPrerequisites): {
  canAutoImport: boolean;
  nextSteps: string[];
  buttonText: string;
  buttonAction: string;
} {
  if (!prereqs.hasVapiKey) {
    return {
      canAutoImport: false,
      nextSteps: ["Add your Vapi API key in Settings → Vapi"],
      buttonText: "Add Vapi Key",
      buttonAction: "/settings?tab=vapi",
    };
  }

  if (!prereqs.hasAssistant) {
    return {
      canAutoImport: false,
      nextSteps: ["Create your first assistant to link with this number"],
      buttonText: "Create Assistant",
      buttonAction: "/settings?tab=vapi&action=create-assistant",
    };
  }

  return {
    canAutoImport: true,
    nextSteps: [],
    buttonText: "Import Complete",
    buttonAction: "",
  };
}
