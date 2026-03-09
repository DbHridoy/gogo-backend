import { logger, logger as consoleLogger } from "../../utils/logger";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { UserRepository } from "../user/user.repository";
import { createUserType } from "./auth.type";
import { HashUtils } from "../../utils/hash-utils";
import { JwtUtils } from "../../utils/jwt-utils";
import { Mailer } from "../../utils/mailer-utils";

export class AuthService {

  constructor(private authRepo: AuthRepository, private userRepo: UserRepository, private hashUtils: HashUtils, private jwtUtils: JwtUtils, private mailerUtils: Mailer) { }

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

  register = async (userBody: createUserType) => {
    logger.info({ userBody }, "UserBody");

    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
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

    await this.sendOtp(userBody.phoneNumber);

    return newUser;
  };

  loginUser = async (phoneNumber: string) => {
    const user = await this.userRepo.findUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }
    // const isVerified = bcrypt.compareSync(password, user.password);
    // logger.info({isVerified}, "Authservice.loginUser line:51");
    // if (!isVerified) {
    //   throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    // }

    return await this.sendOtp(phoneNumber);


  };

  async sendOtp(phoneNumber: string) {
    const user = await this.userRepo.findUserByPhoneNumber(phoneNumber);

    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }
    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Save or update OTP in DB

    try {
      const result = await this.mailerUtils.sendOtp(phoneNumber, otp);
      const insertedOtp = await this.authRepo.createOtp(phoneNumber, otp, expiresAt);
      return {
        success: true,
        data: insertedOtp,
        message: "OTP sent successfully",
      };
    } catch (error) {
      console.error("Email error:", error);
      return { success: false, message: "Failed to send OTP" };
    }
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const record = await this.authRepo.verifyOtp(phoneNumber, Number(otp));
    if (!record) {
      return { success: false, message: "Invalid OTP" };
    }

    if (record.expiresAt < new Date()) {
      return { success: false, message: "OTP expired" };
    }

    // Optionally, delete OTP after verification
    await this.authRepo.deleteOtp(record._id);
    // const payload = {
    //   userId: record.userId,
    //   fullName: record.fullName,
    //   email: record.email,
    //   role: record.role,
    // };

    // const accessToken: string = await this.jwtUtils.generateAccessToken(
    //   payload
    // );

    // const refreshToken: string = await this.jwtUtils.generateRefreshToken(
    //   payload
    // );

    return {
      // user,
      // accessToken,
      // refreshToken,
    };
  }



  // async refreshToken(refreshToken: string) {
  //   const payload = await this.jwtUtils.verifyRefreshToken(refreshToken);

  //   if (!payload || typeof payload === "string" || !("userId" in payload)) {
  //     throw new apiError(Errors.NoToken.code, "Invalid token payload");
  //   }

  //   const user = await this.userRepo.findUserById(payload.userId);

  //   if (!user) {
  //     throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
  //   }

  //   const tokenPayload = {
  //     userId: user._id,
  //     fullName: user.fullName,
  //     email: user.email,
  //     role: user.role,
  //   };

  //   const tokens = await this.jwtUtils.generateBothTokens(tokenPayload);

  //   return {
  //     accessToken: tokens.accessToken,
  //     refreshToken: tokens.refreshToken,
  //   };
  // }
}
