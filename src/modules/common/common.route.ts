import { Router } from "express";
import { authMiddleware, commonController } from "../../container";

const commonRoute = Router();

commonRoute.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      termsOfService: "Welcome to Gogo. By using our service, you agree to our terms...",
      privacyPolicy: "We value your privacy. We collect minimal location and profile data to enable the service...",
      aboutUs: "Gogo is a leading ride-hailing and delivery platform.",
      contactUs: {
        email: "support@gogo.com",
        phone: "+971500000000"
      }
    }
  });
});

commonRoute.use(authMiddleware.authenticate)

commonRoute.get("/notification", commonController.getNotification);
commonRoute.get("/my-notifications", commonController.getMyNotifications);
commonRoute.patch(
  "/notification/:notificationId/read",
  commonController.updateNotificationRead
);
commonRoute.get(
  "/admin/users-stats/:userId",
  authMiddleware.authorize(["Admin"]),
  commonController.getUserStatsById
);
commonRoute.get("/my-stats", commonController.getMyStats);

export default commonRoute;
