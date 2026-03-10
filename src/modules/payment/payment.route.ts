import { Router } from "express";
import { authMiddleware, paymentController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { InitiatePaymentSchema, VerifyPaymentSchema } from "./payment.schema";

const paymentRoute = Router();

paymentRoute.post("/webhook/tap", paymentController.handleTapWebhook);

paymentRoute.use(authMiddleware.authenticate);

paymentRoute.post(
  "/initiate",
  validate(InitiatePaymentSchema),
  paymentController.initiatePayment
);
paymentRoute.get("/history", paymentController.getMyPaymentHistory);
paymentRoute.post("/verify", validate(VerifyPaymentSchema), paymentController.verifyPayment);
paymentRoute.get("/order/:orderId", paymentController.getPaymentsByOrderId);
paymentRoute.get("/:id", paymentController.getPaymentById);

export default paymentRoute;
