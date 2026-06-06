import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    chargeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "AED",
    },
    tapStatus: {
      type: String,
      default: "Initiated",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);

export default Payment;
