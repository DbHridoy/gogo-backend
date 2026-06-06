import { Router } from "express";
import { authMiddleware, dashboardController } from "../../container";

const dashboardRoute = Router();

dashboardRoute.use(authMiddleware.authenticate);

dashboardRoute.get("/rider", dashboardController.getRiderStats);
dashboardRoute.get("/rider/earnings", dashboardController.getRiderEarnings);

export default dashboardRoute;
