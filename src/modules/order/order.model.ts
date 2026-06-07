import { Schema, model, Types } from "mongoose";

const locationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  addressLine: String,
  label: String,
  reachedAt: Date,
});

const checkpointSchema = new Schema({
  pointType: { type: String, required: true },
  stoppageId: Schema.Types.ObjectId,
  note: String,
  timestamp: { type: Date, default: Date.now },
});

const reviewSchema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
});

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    pickup: {
      type: locationSchema,
      required: true,
    },
    dropoff: {
      type: locationSchema,
      required: true,
    },
    stoppages: [locationSchema],
    price: {
      type: Number,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["Bike", "Car", "Truck"],
      default: "Car",
    },
    distanceKm: Number,
    notes: String,
    paymentMethod: {
      type: String,
      enum: ["Card", "Cash"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Pending", "Paid"],
      default: "Unpaid",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "ArrivedPickup", "InProgress", "Completed", "Cancelled"],
      default: "Pending",
    },
    checkpoints: [checkpointSchema],
    pickupReachedAt: Date,
    tripStartedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    completionProof: String,
    review: reviewSchema,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", orderSchema);

export default Order;
