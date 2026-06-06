import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { CreateUserSchema, UpdateUserSchemaForOtherRoles } from "./user.schema";
import { authMiddleware, userController } from "../../container";
import { uploadFile } from "../../middlewares/upload.middleware";
import multer from "multer";
import { uploadToS3 } from "../../utils/s3-upload";

const userRoute = Router();

userRoute.use(authMiddleware.authenticate)

userRoute.post("/", authMiddleware.authorize(["Admin"]), validate(CreateUserSchema), userController.createUser);

userRoute.get("/", userController.getAllUsers);
userRoute.get(
  "/me",
  authMiddleware.authenticate,
  userController.getMyProfile
);
// userRoute.get("/sales-reps", userController.getSalesReps)
userRoute.get("/:id", userController.getUserById);

userRoute.patch(
  "/me",
  authMiddleware.authenticate,
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateMyProfile
);

// Document uploads for drivers (Emirates ID, Driving License, Vehicle Registration)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

userRoute.patch(
  "/me/documents",
  authMiddleware.authenticate,
  documentUpload.fields([
    { name: "emaratesId", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "vehicleRegistration", maxCount: 1 },
  ]),
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updateData: any = {};
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files) {
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            const key = `documents/${userId}/${fieldName}-${file.originalname}`;
            const fileUrl = await uploadToS3(file.buffer, key, file.mimetype);
            updateData[fieldName] = fileUrl;
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No documents provided" });
      }

      const { userService } = require("../../container");
      const updatedUser = await userService.updateMyProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

userRoute.patch(
  "/:id",
  authMiddleware.authorize(["Admin"]),
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateUser
);

userRoute.delete("/:id", authMiddleware.authorize(["Admin"]), userController.deleteUser);

export default userRoute;
