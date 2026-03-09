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
  },
  {
    timestamps: true,
  }
);

const Common = model("Common", commonSchema);

export default Common;
