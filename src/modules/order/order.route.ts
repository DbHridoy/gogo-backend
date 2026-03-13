import { Router } from "express";
import { authMiddleware, orderController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import {
  AddOrderReviewSchema,
  AssignRiderSchema,
  CreateOrderSchema,
  MarkCheckpointSchema,
  UpdateOrderPriceSchema,
  UpdateOrderStatusSchema,
} from "./order.schema";

const orderRoute = Router();

orderRoute.use(authMiddleware.authenticate);

orderRoute.get("/summary", orderController.getOrderSummary);
orderRoute.post("/", validate(CreateOrderSchema), orderController.createOrder);
orderRoute.get("/", orderController.getAllOrders);
orderRoute.get("/:id", orderController.getOrderById);

orderRoute.patch(
  "/:id/assign-rider",
  validate(AssignRiderSchema),
  orderController.assignRider
);
orderRoute.patch(
  "/:id/status",
  validate(UpdateOrderStatusSchema),
  orderController.updateOrderStatus
);
orderRoute.patch(
  "/:id/checkpoints",
  validate(MarkCheckpointSchema),
  orderController.markCheckpointReached
);
orderRoute.patch(
  "/:id/price",
  authMiddleware.authorize(["Admin"]),
  validate(UpdateOrderPriceSchema),
  orderController.updateOrderPrice
);
orderRoute.patch(
  "/:id/review",
  validate(AddOrderReviewSchema),
  orderController.addReview
);
orderRoute.patch("/:id/cancel", orderController.cancelOrder);

orderRoute.delete(
  "/:id",
  authMiddleware.authorize(["Admin"]),
  orderController.deleteOrder
);

export default orderRoute;
