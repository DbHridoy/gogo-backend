import { Types } from "mongoose";
import OTPModel from "./otp.model";

export class AuthRepository {
  createOtp = async (phoneNumber: string, otp: number, expiresAt: Date) => {
    const record = await OTPModel.findOneAndUpdate(
      { phoneNumber },
      { otp, expiresAt },
      { upsert: true, new: true }
    );
    return record;
  };

  verifyOtp = async (phoneNumber: string, otp: number) => {
    const record = await OTPModel.findOne({ phoneNumber, otp });
    return record;
  };

  deleteOtp = async (id: Types.ObjectId) => {
    const record = await OTPModel.findOneAndDelete({ _id: id });
    return record;
  };
}
