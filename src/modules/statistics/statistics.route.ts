import { Router } from "express";
import { authMiddleware, dashboardController } from "../../container";

const statisticsRoute = Router();

statisticsRoute.use(authMiddleware.authenticate);

// Admin Bookings List
statisticsRoute.get(
  "/admin-bookings",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getAdminEarnings // we can reuse this or create a specific one
);

export default statisticsRoute;
