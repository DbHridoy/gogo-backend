import { Router } from "express";
import { authMiddleware, commonController } from "../../container";

const commonRoute = Router();

commonRoute.use(authMiddleware.authenticate)

commonRoute.post("/upsert-variable", commonController.upsertVariable);
commonRoute.post("/cluster", commonController.createCluster);

commonRoute.get("/get-variable", commonController.getVariable);
commonRoute.get("/notification", commonController.getNotification);
commonRoute.get("/my-notifications", commonController.getMyNotifications);
commonRoute.patch(
  "/notification/:notificationId/read",
  commonController.updateNotificationRead
);
commonRoute.get("/cluster", commonController.getCluster);
commonRoute.get(
  "/admin/users-stats/:userId",
  authMiddleware.authorize(["Admin"]),
  commonController.getUserStatsById
);
commonRoute.get(
  "/salesrep-leaderboard",
  commonController.getSalesRepLeaderboard
);
commonRoute.get("/my-stats", commonController.getMyStats);
commonRoute.get(
  "/summary-stats",
  authMiddleware.authorize(["Admin"]),
  commonController.getSummaryStats
);
commonRoute.post(
  "/payments",
  authMiddleware.authorize(["Admin"]),
  commonController.addPayment
);
commonRoute.get(
  "/payments",
  // authMiddleware.authorize(["Admin"]),
  commonController.getPayments
);
commonRoute.delete(
  "/payments/:paymentId",
  authMiddleware.authorize(["Admin"]),
  commonController.deletePayment
);
commonRoute.patch(
  "/payments/:paymentId",
  authMiddleware.authorize(["Admin"]),
  commonController.updatePayment
);


export default commonRoute;
