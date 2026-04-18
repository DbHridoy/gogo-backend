import OTPModel from "./otp.model";

export class AuthRepository {
  upsertOtp = async (email: string, otp: number, purpose: string, expiresAt: Date) => {
    return OTPModel.findOneAndUpdate(
      { email: email.toLowerCase(), purpose },
      { email: email.toLowerCase(), otp, purpose, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  };

  getOtp = async (email: string, otp: number, purpose: string) => {
    return OTPModel.findOne({
      email: email.toLowerCase(),
      otp,
      purpose,
      expiresAt: { $gt: new Date() },
    });
  };

  deleteOtp = async (email: string, purpose: string) => {
    return OTPModel.deleteOne({ email: email.toLowerCase(), purpose });
  };
}
