import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { CommonService } from "./common.service";
import { HttpCodes } from "../../constants/status-codes";

export class CommonController {
  constructor(private commonService: CommonService) {}

  private formatContentResponse(content: any) {
    return {
      about: content?.about ?? "",
      privacyPolicy: content?.privacyPolicy ?? "",
      termsAndConditions: content?.termsAndConditions ?? "",
    };
  }

  private formatDeliverySettingsResponse(content: any) {
    return {
      baseDeliveryCharge: content?.deliverySettings?.baseDeliveryCharge ?? 0,
      chargePerMile: content?.deliverySettings?.chargePerMile ?? 0,
      minimumDistanceMiles: content?.deliverySettings?.minimumDistanceMiles ?? 0,
    };
  }

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

  updateContent = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updateContent(req.body);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Common content updated successfully",
        data: this.formatContentResponse(content),
      });
    }
  );

  updateDeliverySettings = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.updateDeliverySettings(req.body);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Delivery settings updated successfully",
        data: this.formatDeliverySettingsResponse(content),
      });
    }
  );
}
