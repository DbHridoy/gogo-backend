import { z } from "zod";

export const UpdateCommonContentSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
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
