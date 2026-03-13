import { z } from "zod";
import {
  AddOrderReviewSchema,
  AssignRiderSchema,
  CreateOrderSchema,
  MarkCheckpointSchema,
  UpdateOrderPriceSchema,
  UpdateOrderStatusSchema,
} from "./order.schema";

export type CreateOrderType = z.infer<typeof CreateOrderSchema>;
export type AssignRiderType = z.infer<typeof AssignRiderSchema>;
export type UpdateOrderStatusType = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateOrderPriceType = z.infer<typeof UpdateOrderPriceSchema>;
export type AddOrderReviewType = z.infer<typeof AddOrderReviewSchema>;
export type MarkCheckpointType = z.infer<typeof MarkCheckpointSchema>;
