import { Schema, model } from "mongoose";

const commonSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "singleton",
    },
    about: {
      type: String,
      default: "",
      trim: true,
    },
    privacyPolicy: {
      type: String,
      default: "",
      trim: true,
    },
    termsAndConditions: {
      type: String,
      default: "",
      trim: true,
    },
    deliverySettings: {
      baseDeliveryCharge: {
        type: Number,
        default: 0,
        min: 0,
      },
      chargePerMile: {
        type: Number,
        default: 0,
        min: 0,
      },
      minimumDistanceMiles: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Common = model("Common", commonSchema);

export default Common;
