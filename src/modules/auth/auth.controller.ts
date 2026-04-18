import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { logger } from "../../utils/logger";
import { AuthService } from "./auth.service";
import { HttpCodes } from "../../constants/status-codes";
import { Errors } from "../../constants/error-codes";
import { apiError } from "../../errors/api-error";

export class AuthController {
  constructor(private authService: AuthService) { }

  checkUserByPhoneNumber = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.authService.checkUserByPhoneNumber(
        req.body.phoneNumber
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: result.message,
        data: result,
      });
    }
  );

  register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userBody = req.body;
      logger.info(userBody, "userBody");
      const newUser = await this.authService.register(userBody);
      res.status(HttpCodes.Created).json({
        success: true,
        message: "User registered successfully",
        data: newUser,
      });
    }
  );

  loginUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body;
      logger.info(body, "Login body");
      const result = await this.authService.loginUser(body.phoneNumber);
      res.status(HttpCodes.Ok).json(result);
    }
  );

  adminLogin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const record = await this.authService.adminLogin(req.body.email, req.body.password);

      res.cookie("refreshToken", record.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Admin login successful",
        data: record,
      });
    }
  );

  forgotAdminPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.authService.forgotAdminPassword(req.body.email);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: result.message,
      });
    }
  );

  verifyAdminResetOtp = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.authService.verifyAdminResetOtp(
        req.body.email,
        req.body.otp
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: result.message,
      });
    }
  );

  resetAdminPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const result = await this.authService.resetAdminPassword(
        req.body.email,
        req.body.otp,
        req.body.newPassword
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: result.message,
      });
    }
  );

  // reset password
  // sendOtp = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { email } = req.body;
  //     const result = await this.authService.sendOtp(email);
  //     logger.info(result, "result");
  //     res.status(HttpCodes.Ok).json(result);
  //   }
  // );

  verifyOtp = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { phoneNumber, idToken } = req.body;
      const record = await this.authService.verifyOtp(phoneNumber, idToken);
      res.cookie("refreshToken", record.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Login successful",
        data: record,
      });
    }
  );

  // setNewPassword = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { email, newPassword, confirmPassword } = req.body;

  //     // Basic validation
  //     if (!newPassword || !confirmPassword) {
  //       return res.status(HttpCodes.BadRequest).json({
  //         success: false,
  //         message: "All fields are required",
  //       });
  //     }

  //     if (newPassword !== confirmPassword) {
  //       return res.status(HttpCodes.BadRequest).json({
  //         success: false,
  //         message: "New password and confirm password do not match",
  //       });
  //     }

  //     // Call service
  //     const result = await this.authService.setNewPassword(email, newPassword);

  //     return res
  //       .status(result.success ? HttpCodes.Ok : HttpCodes.BadRequest)
  //       .json(result);
  //   }
  // );

  // refreshToken = asyncHandler(
  //   async (req: Request, res: Response, _next: NextFunction) => {
  //     const refreshToken = req.cookies?.refreshToken;
  //     logger.info(refreshToken, "AuthController.refreshToken line:106");
  //     if (!refreshToken) {
  //       throw new apiError(Errors.NoToken.code, "Refresh token is required");
  //     }

  //     const result = await this.authService.refreshToken(refreshToken);

  //     // Optionally update the cookie with new refresh token
  //     res.cookie("refreshToken", result.refreshToken, {
  //       httpOnly: true,
  //       secure: false, // HTTP in dev
  //       sameSite: "lax", // works on cross-port dev
  //       maxAge: 7 * 24 * 60 * 60 * 1000,
  //       path: "/auth/refresh-token",
  //     });

  //     const responseData = {
  //       ...result,
  //     };

  //     res.status(HttpCodes.Ok).json(responseData);
  //   }
  // );

  logout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      logger.info(
        { cookies: req.cookies },
        "AuthController.logout line:137"
      );
      if (!req.cookies.refreshToken) {
        throw new apiError(Errors.NoToken.code, "Refresh token is required");
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      return res.status(HttpCodes.Ok).json({
        success: true,
        message: "Logged out successfully",
      });
    }
  );
}
