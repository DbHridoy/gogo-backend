import { Schema, model, Types } from "mongoose";

const geoPointSchema = new Schema(
  {
    label: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rider: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    pickup: {
      type: geoPointSchema,
      required: true,
    },
    dropoff: {
      type: geoPointSchema,
      required: true,
    },
    stoppages: {
      type: [geoPointSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["ReferralFirstOrder"],
    },
    vehicleType: {
      type: String,
      enum: ["Bike", "Car", "Truck"],
      default: "Bike",
    },
    distanceKm: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "ArrivedPickup",
        "InProgress",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", orderSchema);

export default Order;
