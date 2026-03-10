import { Schema, model } from "mongoose";

const savedAddressSchema = new Schema(
  {
    label: {
      type: String,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    companyName: {
      type: String,
    },
    trnVatNo: {
      type: String,
    },
    referralCode: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredByReferralCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    referralDiscountUsed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User", "Rider"],
    },
    emaratesId: {
      type: String,
      required: function () {
        return this.role === "Rider";
      },
    },
    drivingLicense: {
      type: String,
      required: function () {
        return this.role === "Rider";
      },
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    savedAddresses: {
      type: [savedAddressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = model("User", userSchema);

export default User;
