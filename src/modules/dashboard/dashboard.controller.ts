import { NextFunction, Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getRiderStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const riderId = req.user!.userId;
      const data = await this.dashboardService.getRiderStats(riderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Rider daily stats fetched successfully",
        data,
      });
    }
  );

  getRiderEarnings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const riderId = req.user!.userId;
      const data = await this.dashboardService.getRiderEarnings(riderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Rider earnings fetched successfully",
        data,
      });
    }
  );
}
