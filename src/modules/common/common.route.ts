import { Router } from "express";
import { authMiddleware, commonController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { UpdateCommonContentSchema } from "./common.schema";

const commonRoute = Router();

commonRoute.get("/", commonController.getContent);

commonRoute.patch(
  "/about",
  authMiddleware.authenticate,
  authMiddleware.authorize(["Admin"]),
  validate(UpdateCommonContentSchema),
  commonController.updateAbout
);

commonRoute.patch(
  "/privacy-policy",
  authMiddleware.authenticate,
  authMiddleware.authorize(["Admin"]),
  validate(UpdateCommonContentSchema),
  commonController.updatePrivacyPolicy
);

commonRoute.patch(
  "/terms-and-conditions",
  authMiddleware.authenticate,
  authMiddleware.authorize(["Admin"]),
  validate(UpdateCommonContentSchema),
  commonController.updateTermsAndConditions
);

export default commonRoute;
