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
  email: z.email(),
  password: z.string(),
});
