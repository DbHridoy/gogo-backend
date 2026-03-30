import { Router } from "express";
import { authMiddleware, dashboardController } from "../../container";

const dashboardRoute = Router();

dashboardRoute.use(authMiddleware.authenticate);
dashboardRoute.use(authMiddleware.authorize(["Admin"]));

dashboardRoute.get("/", dashboardController.getAdminDashboard);

export default dashboardRoute;
