import { logger } from "../../utils/logger";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { UserRepository } from "../user/user.repository";
import { createUserType } from "./auth.type";
import { JwtUtils } from "../../utils/jwt-utils";
import { getFirebaseAdmin } from "../../config/firebase";
import { HashUtils } from "../../utils/hash-utils";
import { Mailer } from "../../utils/mailer-utils";

const ADMIN_RESET_PASSWORD_PURPOSE = "admin-forgot-password";

export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private userRepo: UserRepository,
    private jwtUtils: JwtUtils,
    private hashUtils: HashUtils,
    private mailer: Mailer
  ) {}

  private generateReferralCodeValue() {
    return `REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }

  private generateUniqueReferralCode = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const referralCode = this.generateReferralCodeValue();
      const existingUser = await this.userRepo.findUserByReferralCode(referralCode);

      if (!existingUser) {
        return referralCode;
      }
    }

    throw new apiError(
      500,
      "Failed to generate referral code"
    );
  };

  private buildTokenPayload = (user: any) => ({
    userId: String(user._id),
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
  });

  checkUserByPhoneNumber = async (phoneNumber: string) => {
    const user = await this.userRepo.findUserByPhoneNumber(phoneNumber);

    return {
      exists: Boolean(user),
      requiresRegistration: !user,
      message: user
        ? "User exists. Proceed with OTP login."
        : "User not found. Proceed with registration.",
    };
  };

  register = async (userBody: createUserType) => {
    logger.info({ userBody }, "UserBody");

    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
      );
    }

    const existingPhoneUser = await this.userRepo.findUserByPhoneNumber(
      userBody.phoneNumber
    );

    if (existingPhoneUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this phone number"
      );
    }

    const usedReferralCode = userBody.referralCode?.trim().toUpperCase();

    if (usedReferralCode) {
      const referrer = await this.userRepo.findUserByReferralCode(usedReferralCode);

      if (!referrer) {
        throw new apiError(400, "Invalid referral code");
      }
    }

    const user = {
      ...userBody,
      referralCode: await this.generateUniqueReferralCode(),
      referredByReferralCode: usedReferralCode,
    };

    logger.info({ user }, "user");

    const newUser = await this.userRepo.createUser(user);

    return {
      user: newUser,
      otpSent: false,
      requiresOtpLogin: true,
    };
  };

  loginUser = async (phoneNumber: string) => {
    const user = await this.userRepo.findUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }

    if (user.role === "Rider" && user.status === "Pending") {
      throw new apiError(Errors.Forbidden.code, "Rider account is pending admin approval");
    }

    return {
      success: true,
      firebaseOtpRequired: true,
      message: "User exists. Complete phone OTP with Firebase on the client app.",
    };
  }

  adminLogin = async (email: string, password: string) => {
    const admin = await this.userRepo.findUserByEmailWithPassword(email);

    if (!admin || admin.role !== "Admin" || !admin.password) {
      throw new apiError(Errors.Unauthorized.code, "Invalid admin credentials");
    }

    const passwordMatched = await this.hashUtils.verifyPassword(password, admin.password);

    if (!passwordMatched) {
      throw new apiError(Errors.Unauthorized.code, "Invalid admin credentials");
    }

    const payload = this.buildTokenPayload(admin);
    const { accessToken, refreshToken } = await this.jwtUtils.generateBothTokens(payload);

    return {
      user: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
      accessToken,
      refreshToken,
    };
  };

  forgotAdminPassword = async (email: string) => {
    const admin = await this.userRepo.findUserByEmail(email);

    if (!admin || admin.role !== "Admin") {
      throw new apiError(Errors.NotFound.code, "Admin user not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.authRepo.upsertOtp(email, otp, ADMIN_RESET_PASSWORD_PURPOSE, expiresAt);
    try {
      await this.mailer.sendOtp(email, otp);
    } catch (error: any) {
      if (error?.code === "EAUTH") {
        throw new apiError(
          502,
          "Mail service authentication failed. Update GMAIL_USER/GMAIL_PASS with a valid Gmail app password."
        );
      }

      throw error;
    }

    return {
      message: "Password reset OTP sent to email",
    };
  };

  changeAdminPassword = async (
    currentUser: Express.Request["user"],
    currentPassword: string,
    newPassword: string
  ) => {
    if (!currentUser?.email || currentUser.role !== "Admin") {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    const admin = await this.userRepo.findUserByEmailWithPassword(currentUser.email);

    if (!admin || admin.role !== "Admin" || !admin.password) {
      throw new apiError(Errors.NotFound.code, "Admin user not found");
    }

    const passwordMatched = await this.hashUtils.verifyPassword(
      currentPassword,
      admin.password
    );

    if (!passwordMatched) {
      throw new apiError(Errors.Unauthorized.code, "Current password is incorrect");
    }

    const isSamePassword = await this.hashUtils.verifyPassword(
      newPassword,
      admin.password
    );

    if (isSamePassword) {
      throw new apiError(400, "New password must be different from current password");
    }

    const hashedPassword = await this.hashUtils.hashPassword(newPassword);
    await this.userRepo.updateUserPassword(admin._id, hashedPassword);

    return {
      message: "Admin password changed successfully",
    };
  };

  verifyAdminResetOtp = async (email: string, otp: number) => {
    const admin = await this.userRepo.findUserByEmail(email);

    if (!admin || admin.role !== "Admin") {
      throw new apiError(Errors.NotFound.code, "Admin user not found");
    }

    const otpRecord = await this.authRepo.getOtp(
      email,
      otp,
      ADMIN_RESET_PASSWORD_PURPOSE
    );

    if (!otpRecord) {
      throw new apiError(400, "Invalid or expired OTP");
    }

    return {
      message: "OTP verified successfully",
    };
  };

  resetAdminPassword = async (email: string, otp: number, newPassword: string) => {
    const admin = await this.userRepo.findUserByEmail(email);

    if (!admin || admin.role !== "Admin") {
      throw new apiError(Errors.NotFound.code, "Admin user not found");
    }

    const otpRecord = await this.authRepo.getOtp(
      email,
      otp,
      ADMIN_RESET_PASSWORD_PURPOSE
    );

    if (!otpRecord) {
      throw new apiError(400, "Invalid or expired OTP");
    }

    const hashedPassword = await this.hashUtils.hashPassword(newPassword);
    await this.userRepo.updateUserPassword(admin._id, hashedPassword);
    await this.authRepo.deleteOtp(email, ADMIN_RESET_PASSWORD_PURPOSE);

    return {
      message: "Admin password reset successful",
    };
  };

  async verifyOtp(phoneNumber: string, idToken: string) {
    let decodedToken: any;
    try {
      decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    } catch {
      throw new apiError(401, "Invalid Firebase ID token");
    }

    const firebasePhoneNumber = decodedToken.phone_number;

    if (!firebasePhoneNumber) {
      throw new apiError(400, "Firebase token does not contain a phone number");
    }

    if (firebasePhoneNumber !== phoneNumber) {
      throw new apiError(400, "Phone number does not match verified Firebase token");
    }

    const user = await this.userRepo.findUserByPhoneNumber(phoneNumber);

    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }

    if (user.role === "Rider" && user.status === "Pending") {
      throw new apiError(Errors.Forbidden.code, "Rider account is pending admin approval");
    }

    const payload = this.buildTokenPayload(user);
    const { accessToken, refreshToken } = await this.jwtUtils.generateBothTokens(
      payload
    );

    return {
      user,
      accessToken,
      refreshToken,
      firebaseUid: decodedToken.uid,
    };
  }
  async refreshToken(token: string) {
    try {
      const decoded = (await this.jwtUtils.verifyRefreshToken(token)) as any;
      const user = await this.userRepo.findUserByEmail(decoded.email);

      if (!user) {
        throw new apiError(Errors.NotFound.code, "User not found");
      }

      if (user.role === "Rider" && user.status === "Pending") {
        throw new apiError(Errors.Forbidden.code, "Account is pending approval");
      }

      const payload = this.buildTokenPayload(user);
      const { accessToken, refreshToken } = await this.jwtUtils.generateBothTokens(
        payload
      );

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      throw new apiError(401, "Invalid or expired refresh token");
    }
  }
}
