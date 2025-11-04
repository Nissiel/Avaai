/**
 * 🔥 DIVINE ORCHESTRATOR - Studio Configuration Update
 * 
 * Clean separation of concerns:
 * 1. Save to database (persistence)
 * 2. Sync to Vapi (external service)
 * 3. Orchestrate both operations
 */

import { refreshAccessToken } from "@/lib/auth/session-client";
import { syncStudioConfigToVapi } from "@/lib/api/studio-sync";
import type { 
  DbSaveResult, 
  VapiSyncResult, 
  StudioUpdateResult 
} from "@/lib/types/studio-update";
import type { StudioConfig } from "@/services/config-service";

/**
 * Save studio configuration to database via Next.js API route
 * 
 * @param values - Configuration to save
 * @returns Result with success status and config or error
 */
export async function saveStudioConfigToDb(
  values: Partial<StudioConfig>
): Promise<DbSaveResult> {
  try {
    // Get token from localStorage
    let token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Save to database
    let response = await fetch("/api/config", {
      method: "POST",
      headers,
      body: JSON.stringify(values),
    });

    // Handle 401 - try token refresh
    if (response.status === 401) {
      console.log("⚠️ DB Save: 401 Unauthorized - Attempting token refresh...");
      
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        
        if (newAccessToken) {
          console.log("✅ DB Save: Token refreshed! Retrying...");
          
          // Retry with new token
          response = await fetch("/api/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
            body: JSON.stringify(values),
          });
        }
      }
      
      // If still 401, return error
      if (response.status === 401) {
        return {
          success: false,
          error: "Session expired. Please login again.",
        };
      }
    }

    // Handle other errors
    if (!response.ok) {
      const detail = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("❌ DB Save Failed:", detail);
      return {
        success: false,
        error: detail.error || `HTTP ${response.status}`,
      };
    }

    // Success!
    const data = await response.json();
    console.log("✅ DB Save Success:", data);
    
    return {
      success: true,
      config: data.config,
    };
    
  } catch (error: any) {
    console.error("❌ DB Save Exception:", error);
    return {
      success: false,
      error: error.message || "Failed to save configuration",
    };
  }
}

/**
 * Orchestrator: Save to DB + Sync to Vapi
 * 
 * This is the main function that combines both operations.
 * DB save happens first (required), then Vapi sync (optional).
 * 
 * @param values - Configuration to save and sync
 * @returns Combined result with both DB and Vapi status
 */
export async function updateStudioConfiguration(
  values: Partial<StudioConfig>
): Promise<StudioUpdateResult> {
  console.log("🚀 Studio Config Update Starting:", values);
  
  // Step 1: Save to database (CRITICAL - must succeed)
  const dbResult = await saveStudioConfigToDb(values);
  
  // If DB save failed, don't attempt Vapi sync
  if (!dbResult.success) {
    return {
      db: dbResult,
      vapi: {
        success: false,
        error: "Skipped due to DB save failure",
      },
    };
  }
  
  // Step 2: Sync to Vapi (OPTIONAL - can fail gracefully)
  // Use the saved config from DB result (which is complete)
  const vapiResult = await syncStudioConfigToVapi(
    dbResult.config as any, // Config from DB is complete
    values.vapiAssistantId || null
  );
  
  // Return combined result
  return {
    db: dbResult,
    vapi: vapiResult,
  };
}
