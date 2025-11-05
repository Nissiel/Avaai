/**
 * 🔥 DIVINE TYPES - Studio Configuration Update
 *
 * Clean, explicit types for studio configuration updates.
 * Separates concerns: DB persistence vs Vapi synchronization.
 */

import type { StudioConfig } from "@/services/config-service";

/**
 * Result of saving configuration to database
 */
export type DbSaveResult = {
  success: boolean;
  config?: StudioConfig;
  error?: string;
};

/**
 * Result of synchronizing configuration to Vapi
 */
export type VapiSyncResult = {
  success: boolean;
  assistant?: any;
  error?: string;
};

/**
 * Complete result of studio configuration update
 * Contains both database save and Vapi sync results
 */
export type StudioUpdateResult = {
  db: DbSaveResult;
  vapi: VapiSyncResult;
};

/**
 * Status enum for clearer state management
 */
export enum UpdateStatus {
  DB_ONLY = "db_only",           // Saved to DB but not synced to Vapi
  FULLY_SYNCED = "fully_synced", // Both DB and Vapi succeeded
  FAILED = "failed",              // DB save failed
}

/**
 * Helper to determine overall status
 */
export function getUpdateStatus(result: StudioUpdateResult): UpdateStatus {
  if (!result.db.success) {
    return UpdateStatus.FAILED;
  }

  if (result.vapi.success) {
    return UpdateStatus.FULLY_SYNCED;
  }

  return UpdateStatus.DB_ONLY;
}
