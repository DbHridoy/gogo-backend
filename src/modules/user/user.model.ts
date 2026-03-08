import { Schema, model } from "mongoose";

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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = model("User", userSchema);

export default User;
