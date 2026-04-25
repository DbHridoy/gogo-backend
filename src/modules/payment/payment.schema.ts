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
  postUrl: z.string().url().optional(),
  sourceId: z.string().trim().min(1).default("src_all").optional(),
  customer: customerSchema,
}).superRefine((data, ctx) => {
  const sourceId = data.sourceId?.trim();
  const currency = data.currency?.trim().toUpperCase();

  if (sourceId === "src_kw.knet" && !currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "Currency is required for KNET payments",
    });
  }

  if (sourceId === "src_kw.knet" && currency && currency !== "KWD") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "KNET payments require KWD currency",
    });
  }

  if (sourceId === "src_bh.benefit" && !currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "Currency is required for Benefit payments",
    });
  }

  if (sourceId === "src_bh.benefit" && currency && currency !== "BHD") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "Benefit payments require BHD currency",
    });
  }

  if (sourceId === "src_eg.fawry" && !currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "Currency is required for Fawry payments",
    });
  }

  if (sourceId === "src_eg.fawry" && currency && currency !== "EGP") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currency"],
      message: "Fawry payments require EGP currency",
    });
  }
});

export const VerifyPaymentSchema = z.object({
  chargeId: z.string().trim().min(1),
});
