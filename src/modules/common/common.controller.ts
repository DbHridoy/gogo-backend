import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { CommonService } from "./common.service";
import { HttpCodes } from "../../constants/status-codes";

export class CommonController {
  constructor(private commonService: CommonService) {}

  getContent = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.getContent();

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Common content fetched successfully",
        data: content,
      });
    }
  );

  updateAbout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updateAbout(req.body.content);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "About updated successfully",
        data: content,
      });
    }
  );

  updatePrivacyPolicy = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updatePrivacyPolicy(req.body.content);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Privacy policy updated successfully",
        data: content,
      });
    }
  );

  updateTermsAndConditions = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updateTermsAndConditions(
        req.body.content
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Terms & conditions updated successfully",
        data: content,
      });
    }
  );

  updateDeliverySettings = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updateDeliverySettings(req.body);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Delivery settings updated successfully",
        data: content,
      });
    }
  );
}
