import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { DashboardService } from "./dashboard.service";
import { dashboardQuerySchema } from "./dashboard.schema";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getAdminDashboard = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.user) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const queryResult = dashboardQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        throw queryResult.error;
      }

      const dashboard = await this.dashboardService.getAdminDashboard(
        req.user,
        queryResult.data
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Admin dashboard fetched successfully",
        data: dashboard,
      });
    }
  );
}
