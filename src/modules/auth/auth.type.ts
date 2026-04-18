import {
  adminLoginSchema,
  checkUserByPhoneSchema,
  createUserSchema,
  forgotAdminPasswordSchema,
  loginUserSchema,
  resetAdminPasswordSchema,
  verifyOtpSchema,
} from "./auth.schema";
import { z } from "zod";

export type createUserType = z.infer<typeof createUserSchema>;
export type loginUserType = z.infer<typeof loginUserSchema>;
export type adminLoginType = z.infer<typeof adminLoginSchema>;
export type verifyOtpType = z.infer<typeof verifyOtpSchema>;
export type checkUserByPhoneType = z.infer<typeof checkUserByPhoneSchema>;
export type forgotAdminPasswordType = z.infer<typeof forgotAdminPasswordSchema>;
export type resetAdminPasswordType = z.infer<typeof resetAdminPasswordSchema>;
