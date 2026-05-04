import { Router } from "express";
import { authMiddleware, notificationController } from "../../container";

const notificationRoute = Router();

notificationRoute.use(authMiddleware.authenticate);

notificationRoute.get("/", notificationController.getMyNotifications);
notificationRoute.patch("/:id/read", notificationController.markAsRead);
notificationRoute.patch("/read-all", notificationController.markAllAsRead);

export default notificationRoute;
