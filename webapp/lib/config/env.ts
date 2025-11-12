import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  APP_BACKEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_BACKEND_URL: z.string().url().optional(),
  NODE_ENV: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

const fallbackBackendUrl = "http://localhost:8000";
const backendBaseUrl = result.success
  ? result.data.NEXT_PUBLIC_API_URL ??
    result.data.APP_BACKEND_URL ??
    result.data.NEXT_PUBLIC_APP_BACKEND_URL ??
    fallbackBackendUrl
  : fallbackBackendUrl;

export const env = {
  backendBaseUrl,
  nodeEnv: result.success ? result.data.NODE_ENV ?? "development" : "development",
};

export function getBackendUrl(): string {
  return env.backendBaseUrl;
}
