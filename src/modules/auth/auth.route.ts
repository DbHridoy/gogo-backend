import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import {
  adminLoginSchema,
  checkUserByPhoneSchema,
  createUserSchema,
  forgotAdminPasswordSchema,
  loginUserSchema,
  resetAdminPasswordSchema,
  verifyAdminResetOtpSchema,
  verifyOtpSchema,
} from "./auth.schema";
import { authController } from "../../container";

const authRoute = Router();

// Register route
authRoute.post(
  "/check-user",
  validate(checkUserByPhoneSchema),
  authController.checkUserByPhoneNumber
);

authRoute.post(
  "/register",
  validate(createUserSchema),
  authController.register
);

authRoute.post("/login", validate(loginUserSchema), authController.loginUser);
authRoute.post("/admin/login", validate(adminLoginSchema), authController.adminLogin);
authRoute.post(
  "/admin/forgot-password",
  validate(forgotAdminPasswordSchema),
  authController.forgotAdminPassword
);
authRoute.post(
  "/admin/verify-reset-otp",
  validate(verifyAdminResetOtpSchema),
  authController.verifyAdminResetOtp
);
authRoute.post(
  "/admin/reset-password",
  validate(resetAdminPasswordSchema),
  authController.resetAdminPassword
);

authRoute.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
// authRoute.post("/send-otp", authController.sendOtp);
// authRoute.post("/set-new-password", authController.setNewPassword);
// authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);

export default authRoute;
