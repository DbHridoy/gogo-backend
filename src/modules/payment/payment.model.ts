import { model, Schema, Types } from "mongoose";

const paymentSchema = new Schema(
  {
    order: {
      type: Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "AED",
      uppercase: true,
      trim: true,
    },
    gateway: {
      type: String,
      required: true,
      default: "Tap",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Initiated",
        "Authorized",
        "Captured",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
      index: true,
    },
    gatewayChargeId: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    redirectUrl: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);

export default Payment;
