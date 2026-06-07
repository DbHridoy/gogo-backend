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

  getOverview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.getOverview();
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Dashboard overview fetched successfully",
        data,
      });
    }
  );

  getUserGrowth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { year, month } = req.query;
      const data = await this.dashboardService.getUserGrowth(
        year as string,
        month as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User growth fetched successfully",
        data,
      });
    }
  );

  getRiderGrowth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { timeframe } = req.query;
      const data = await this.dashboardService.getRiderGrowth(
        timeframe as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Rider growth fetched successfully",
        data,
      });
    }
  );

  getRevenueTrend = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { timeframe } = req.query;
      const data = await this.dashboardService.getRevenueTrend(
        timeframe as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Revenue trend fetched successfully",
        data,
      });
    }
  );

  getAdminEarnings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.dashboardService.getAdminEarnings(page, limit);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Admin earnings fetched successfully",
        data,
      });
    }
  );

  getHotAreas = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { timeframe } = req.query;
      const data = await this.dashboardService.getHotAreas(timeframe as string);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Hot areas fetched successfully",
        data,
      });
    }
  );
}
