import { Router } from "express";
import { authMiddleware, commonController } from "../../container";

const commonRoute = Router();

commonRoute.use(authMiddleware.authenticate)

commonRoute.get("/notification", commonController.getNotification);
commonRoute.get("/my-notifications", commonController.getMyNotifications);
commonRoute.patch(
  "/notification/:notificationId/read",
  commonController.updateNotificationRead
);
commonRoute.get(
  "/admin/users-stats/:userId",
  authMiddleware.authorize(["Admin"]),
  commonController.getUserStatsById
);
commonRoute.get("/my-stats", commonController.getMyStats);

export default commonRoute;
