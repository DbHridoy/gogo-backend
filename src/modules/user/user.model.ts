import { Schema, model } from "mongoose";

const addressSchema = new Schema({
  label: String,
  addressLine: String,
  latitude: Number,
  longitude: Number,
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User", "Rider"],
    },
    password: {
      type: String,
      required: false,
    },
    companyName: String,
    trnVatNo: String,
    emaratesId: String,
    drivingLicense: String,
    vehicleRegistration: String,
    referralCode: String,
    location: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("fullName").get(function (this: any) {
  if (this.firstName || this.lastName) {
    return `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  return this.name;
});

const User = model("User", userSchema);

export default User;
