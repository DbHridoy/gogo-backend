import { z } from "zod";

const customerSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phoneCountryCode: z.string().trim().min(1).optional(),
    phoneNumber: z.string().trim().min(4).optional(),
  })
  .optional();

export const InitiatePaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  description: z.string().trim().optional(),
  redirectUrl: z.string().url().optional(),
  sourceId: z.string().trim().min(1).default("src_all").optional(),
  customer: customerSchema,
});

export const VerifyPaymentSchema = z.object({
  chargeId: z.string().trim().min(1),
});
