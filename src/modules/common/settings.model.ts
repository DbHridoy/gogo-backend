import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
  {
    termsOfService: { type: String, default: "Terms of service..." },
    privacyPolicy: { type: String, default: "Privacy policy..." },
    aboutUs: { type: String, default: "About us..." },
    contactUs: {
      email: { type: String, default: "support@gogo.com" },
      phone: { type: String, default: "+971500000000" },
    },
    deliverySettings: {
      baseFee: { type: Number, default: 5 },
      perKmRate: { type: Number, default: 2.5 },
      serviceRadius: { type: Number, default: 50 },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = model("Settings", settingsSchema);

export default Settings;
