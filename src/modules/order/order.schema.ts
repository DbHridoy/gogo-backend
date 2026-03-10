import { z } from "zod";

const geoPointSchema = z.object({
  label: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const CreateOrderSchema = z.object({
  user: z.string().optional(),
  rider: z.string().optional(),
  pickup: geoPointSchema,
  dropoff: geoPointSchema,
  stoppages: z.array(geoPointSchema).optional().default([]),
  price: z.number().min(0),
  distanceKm: z.number().min(0).optional(),
  paymentStatus: z.enum(["Unpaid", "Paid", "Refunded"]).optional(),
  notes: z.string().trim().optional(),
});

export const AssignRiderSchema = z.object({
  riderId: z.string().min(1),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "Pending",
    "Accepted",
    "ArrivedPickup",
    "InProgress",
    "Completed",
    "Cancelled",
  ]),
});

export const UpdateOrderPriceSchema = z.object({
  price: z.number().min(0),
});

export const AddOrderReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().trim().optional(),
});
