import { z } from "zod";

export const createUserSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    email: z.email(),
    companyName: z.string().optional(),
    trnVatNo: z.string().optional(),
    referralCode: z.string().optional(),
    role: z.enum(["Admin", "User", "Rider"]),
    emaratesId: z.string().optional(),
    drivingLicense: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "Rider") {
      if (!data.emaratesId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Emarates ID is required for Rider",
          path: ["emaratesId"],
        });
      }
      if (!data.drivingLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Driving license is required for Rider",
          path: ["drivingLicense"],
        });
      }
    }
  });

export const loginUserSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyOtpSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const checkUserByPhoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const forgotAdminPasswordSchema = z.object({
  email: z.email(),
});

export const verifyAdminResetOtpSchema = z.object({
  email: z.email(),
  otp: z.coerce.number().int().min(100000).max(999999),
});

export const resetAdminPasswordSchema = z
  .object({
    email: z.email(),
    otp: z.coerce.number().int().min(100000).max(999999),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });
