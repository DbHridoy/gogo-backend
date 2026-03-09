import { Router } from "express";
import userRoute from "../modules/user/user.route";
import authRoute from "../modules/auth/auth.route";
import orderRoute from "../modules/order/order.route";
import paymentRoute from "../modules/payment/payment.route";
import commonRoute from "../modules/common/common.route";

const appRouter = Router();

const moduleRoutes = [
  {
    path: "/auth",
    router: authRoute,
  },
  {
    path: "/users",
    router: userRoute,
  },
  {
    path: "/orders",
    router: orderRoute,
  },
  {
    path: "/payments",
    router: paymentRoute,
  },
  {
    path: "/common",
    router: commonRoute,
  },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.router));

export default appRouter;
