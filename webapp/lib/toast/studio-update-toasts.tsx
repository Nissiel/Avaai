/**
 * 🔥 DIVINE TOAST HANDLER - Studio Configuration Updates
 * 
 * Centralized, logical toast management for studio updates.
 * Clear feedback based on operation results.
 */

import { toast } from "sonner";
import type { StudioUpdateResult } from "@/lib/types/studio-update";
import { getUpdateStatus, UpdateStatus } from "@/lib/types/studio-update";

/**
 * Show appropriate toast(s) based on update result
 * 
 * Handles 3 cases:
 * 1. Complete failure (DB save failed)
 * 2. Partial success (DB saved but Vapi sync failed)
 * 3. Complete success (Both DB and Vapi succeeded)
 */
export function handleStudioUpdateToasts(result: StudioUpdateResult): void {
  const status = getUpdateStatus(result);
  
  switch (status) {
    case UpdateStatus.FAILED:
      // DB save failed - nothing was saved
      toast.error("❌ Failed to save configuration", {
        description: result.db.error || "Unable to save your settings to database",
        duration: 8000,
      });
      break;
      
    case UpdateStatus.DB_ONLY:
      // Saved to DB but Vapi sync failed
      toast.warning("⚠️ Configuration saved locally", {
        description:
          result.vapi.error ??
          "Settings saved to database, but Vapi sync failed. Your assistant may not reflect these changes yet.",
        duration: 8000,
      });
      
      // Also show the Vapi error details
      if (result.vapi.error) {
        console.error("Vapi sync error:", result.vapi.error);
      }
      break;

    case UpdateStatus.VAPI_SKIPPED:
      toast.info("💾 Settings saved", {
        description:
          result.vapi.error ??
          "We skipped Vapi sync because your Vapi API key isn't configured yet. Configure it in Settings → Vapi to enable sync.",
        duration: 6000,
      });
      break;
      
    case UpdateStatus.FULLY_SYNCED:
      // Both DB and Vapi succeeded!
      const assistant = result.vapi.assistant;
      const isNewAssistant = assistant && !result.db.config?.vapiAssistantId;
      
      if (isNewAssistant) {
        toast.success("🆕 New Assistant Created!", {
          description: `Successfully created: ${assistant.name || "Your AI assistant"}`,
          duration: 5000,
        });
      } else {
        toast.success("✅ Configuration synced successfully!", {
          description: (
            <div className="space-y-1 text-xs">
              <div>✅ Saved to database</div>
              <div>✅ Synced to Vapi</div>
              {assistant?.voice && (
                <div className="text-[10px] opacity-70 mt-1">
                  Voice: {assistant.voice.provider} @ {assistant.voice.speed || 1}x
                </div>
              )}
            </div>
          ),
          duration: 5000,
        });
      }
      break;
  }
}

/**
 * Show error toast for update failures
 */
export function handleStudioUpdateError(error: Error): void {
  toast.error("❌ Update failed", {
    description: error.message || "An unexpected error occurred",
    duration: 8000,
  });
}

/**
 * Show loading toast during update
 * Returns toast ID for dismissal
 */
export function showStudioUpdateLoading(): string | number {
  return toast.loading("💾 Saving configuration...", {
    description: "Updating your AI assistant settings",
  });
}
