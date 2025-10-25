import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export type ProfileSettingsValues = {
  name: string;
  email: string;
  phone?: string;
  locale: string;
};

export function createProfileSettingsSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  return z.object({
    name: z
      .string()
      .min(2, t("errors.nameMin"))
      .max(100, t("errors.nameMax")),
    email: z.string().email(t("errors.email")),
    phone: z
      .string()
      .optional()
      .transform((value) => (value?.trim() ? value.trim() : ""))
      .refine((value) => !value || phoneRegex.test(value), t("errors.phone")),
    locale: z
      .string()
      .min(2, t("errors.locale"))
      .regex(/^[a-z]{2}$/, t("errors.locale")),
  });
}
