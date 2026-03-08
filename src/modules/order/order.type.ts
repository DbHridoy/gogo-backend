import { z } from "zod";
import {
  AssignRiderSchema,
  CreateOrderSchema,
  UpdateOrderPriceSchema,
  UpdateOrderStatusSchema,
} from "./order.schema";

export type CreateOrderType = z.infer<typeof CreateOrderSchema>;
export type AssignRiderType = z.infer<typeof AssignRiderSchema>;
export type UpdateOrderStatusType = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateOrderPriceType = z.infer<typeof UpdateOrderPriceSchema>;
