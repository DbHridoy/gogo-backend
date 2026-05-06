import { z } from "zod";

export const UpdateCommonContentSchema = z
  .object({
    about: z.string().trim().min(1, "About is required").optional(),
    privacyPolicy: z
      .string()
      .trim()
      .min(1, "Privacy policy is required")
      .optional(),
    termsAndConditions: z
      .string()
      .trim()
      .min(1, "Terms and conditions are required")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one content field is required",
  });

export const UpdateDeliverySettingsSchema = z
  .object({
    baseDeliveryCharge: z.number().min(0).optional(),
    chargePerMile: z.number().min(0).optional(),
    minimumDistanceMiles: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one delivery setting is required",
  });
