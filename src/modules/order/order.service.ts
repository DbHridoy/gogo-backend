import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { OrderRepository } from "./order.repository";
import { UserRepository } from "../user/user.repository";

const REFERRAL_FIRST_ORDER_DISCOUNT = 10;

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Accepted", "Cancelled"],
  Accepted: ["ArrivedPickup", "Cancelled"],
  ArrivedPickup: ["InProgress", "Cancelled"],
  InProgress: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private userRepo: UserRepository
  ) {}

  createOrder = async (currentUser: any, payload: any) => {
    if (payload.price < 0) {
      throw new apiError(400, "Price must be greater than or equal to 0");
    }

    const ownerUserId = payload.user || currentUser.userId;

    if (currentUser.role === "User" && ownerUserId !== currentUser.userId) {
      throw new apiError(Errors.Forbidden.code, "Users can only create their own ride orders");
    }

    const user = await this.userRepo.findUserById(ownerUserId);
    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found for this order");
    }

    if (payload.rider) {
      const rider = await this.userRepo.findUserById(payload.rider);
      if (!rider || rider.role !== "Rider") {
        throw new apiError(400, "Assigned rider must be a valid Rider user");
      }
    }

    const existingOrderCount = await this.orderRepo.countOrdersByUser(ownerUserId);
    const eligibleForReferralDiscount =
      existingOrderCount === 0 &&
      !!user.referredByReferralCode &&
      !user.referralDiscountUsed;

    const discountAmount = eligibleForReferralDiscount
      ? Math.min(REFERRAL_FIRST_ORDER_DISCOUNT, payload.price)
      : 0;

    const order = await this.orderRepo.createOrder({
      ...payload,
      originalPrice: payload.price,
      price: payload.price - discountAmount,
      discountAmount,
      discountType: discountAmount > 0 ? "ReferralFirstOrder" : undefined,
      user: ownerUserId,
      status: payload.rider ? "Accepted" : "Pending",
    });

    if (discountAmount > 0) {
      await this.userRepo.updateUser(ownerUserId, { referralDiscountUsed: true });
    }

    return this.orderRepo.getOrderById(String(order._id));
  };

  getAllOrders = async (currentUser: any, query: any) => {
    const scopedQuery = { ...query };

    if (currentUser.role === "User") {
      scopedQuery.userId = currentUser.userId;
    }

    if (currentUser.role === "Rider") {
      scopedQuery.riderId = currentUser.userId;
    }

    return this.orderRepo.getAllOrders(scopedQuery);
  };

  getOrderById = async (currentUser: any, id: string) => {
    const order = await this.orderRepo.getOrderById(id);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    if (
      currentUser.role !== "Admin" &&
      String(order.user?._id || order.user) !== currentUser.userId &&
      String(order.rider?._id || order.rider) !== currentUser.userId
    ) {
      throw new apiError(Errors.Forbidden.code, "You do not have access to this order");
    }

    return order;
  };

  assignRider = async (currentUser: any, orderId: string, riderId: string) => {
    const order = await this.orderRepo.getOrderById(orderId);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    if (order.status === "Completed" || order.status === "Cancelled") {
      throw new apiError(400, "Cannot assign rider to a completed or cancelled order");
    }

    if (currentUser.role === "Rider") {
      if (currentUser.userId !== riderId) {
        throw new apiError(Errors.Forbidden.code, "Rider can only assign themselves");
      }
      if (order.rider && String(order.rider) !== currentUser.userId) {
        throw new apiError(Errors.Forbidden.code, "Order already assigned to another rider");
      }
    }

    const rider = await this.userRepo.findUserById(riderId);
    if (!rider || rider.role !== "Rider") {
      throw new apiError(400, "Invalid rider");
    }

    return this.orderRepo.updateOrder(orderId, {
      rider: riderId,
      status: order.status === "Pending" ? "Accepted" : order.status,
    });
  };

  updateOrderStatus = async (
    currentUser: any,
    orderId: string,
    status: string
  ) => {
    const order = await this.orderRepo.getOrderById(orderId);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    const assignedRiderId = order.rider ? String(order.rider) : null;

    if (currentUser.role === "Rider" && assignedRiderId !== currentUser.userId) {
      throw new apiError(Errors.Forbidden.code, "Only assigned rider can update order status");
    }

    if (currentUser.role === "User") {
      throw new apiError(Errors.Forbidden.code, "User cannot update order status directly");
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new apiError(
        400,
        `Invalid status transition from ${order.status} to ${status}`
      );
    }

    return this.orderRepo.updateOrder(orderId, { status });
  };

  updateOrderPrice = async (
    currentUser: any,
    orderId: string,
    price: number
  ) => {
    if (currentUser.role !== "Admin") {
      throw new apiError(Errors.Forbidden.code, "Only admin can update ride price");
    }

    if (price < 0) {
      throw new apiError(400, "Price must be greater than or equal to 0");
    }

    const order = await this.orderRepo.getOrderById(orderId);
    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    return this.orderRepo.updateOrder(orderId, { price });
  };

  cancelOrder = async (currentUser: any, orderId: string) => {
    const order = await this.orderRepo.getOrderById(orderId);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    const isOwner = String(order.user?._id || order.user) === currentUser.userId;
    const isAssignedRider = String(order.rider?._id || order.rider) === currentUser.userId;
    const isAdmin = currentUser.role === "Admin";

    if (!isOwner && !isAssignedRider && !isAdmin) {
      throw new apiError(Errors.Forbidden.code, "You cannot cancel this order");
    }

    if (order.status === "Completed" || order.status === "Cancelled") {
      throw new apiError(400, `Order already ${order.status}`);
    }

    return this.orderRepo.updateOrder(orderId, { status: "Cancelled" });
  };

  deleteOrder = async (currentUser: any, id: string) => {
    if (currentUser.role !== "Admin") {
      throw new apiError(Errors.Forbidden.code, "Only admin can delete order");
    }

    const order = await this.orderRepo.getOrderById(id);
    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    return this.orderRepo.deleteOrder(id);
  };
}
