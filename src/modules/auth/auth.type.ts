import {
  checkUserByPhoneSchema,
  createUserSchema,
  loginUserSchema,
  verifyOtpSchema,
} from "./auth.schema";
import { z } from "zod";

export type createUserType = z.infer<typeof createUserSchema>;
export type loginUserType = z.infer<typeof loginUserSchema>;
export type verifyOtpType = z.infer<typeof verifyOtpSchema>;
export type checkUserByPhoneType = z.infer<typeof checkUserByPhoneSchema>;
