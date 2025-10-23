import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  remember: z.boolean().optional(),
});

export const verifyTotpSchema = z.object({
  token: z
    .string()
    .min(6)
    .max(6)
    .regex(/^[0-9]+$/, "Token must be numeric"),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
});
