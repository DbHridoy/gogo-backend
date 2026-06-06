import { z } from "zod";

const roleEnum = z.enum(["Admin", "User", "Rider"]);

export const createUserSchema = z.union([
  z.object({
    fullName: z.string(),
    email: z.string().email(),
    role: roleEnum,
    password: z.string(),
  }),
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phoneNumber: z.string(),
    role: roleEnum,
    companyName: z.string().optional(),
    trnVatNo: z.string().optional(),
    referralCode: z.string().optional(),
    emaratesId: z.string().optional(),
    drivingLicense: z.string().optional(),
  }),
]);

export const loginUserSchema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  z.object({
    phoneNumber: z.string(),
  }),
]);

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});


