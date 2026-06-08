import { OrderRepository } from "./order.repository";
import Settings from "../common/settings.model";
import { apiError } from "../../errors/api-error";
import User from "../user/user.model";

export class OrderService {
  constructor(private orderRepo: OrderRepository) {}

  estimatePrice = async (distanceKm: number, durationMin: number, vehicleType?: string) => {
    const settingsDoc = await Settings.findOne().lean();
    const deliverySettings = settingsDoc?.deliverySettings;

    let base = deliverySettings?.baseDeliveryCharge ?? 5.0;
    let rate = deliverySettings?.chargePerMile ?? 2.5;

    if (vehicleType === "Bike") {
      rate = rate * 0.72;
      base = base * 0.7;
    } else if (vehicleType === "Truck") {
      rate = rate * 2.0;
      base = base * 2.4;
    }

    const calculatedPrice = base + (distanceKm * rate);
    const roundedPrice = Math.round(calculatedPrice * 100) / 100;

    return {
      distanceKm,
      durationMin,
      vehicleType: vehicleType as any,
      price: roundedPrice,
      currency: "AED",
    };
  };

  createOrder = async (userId: string, orderData: any) => {
    return await this.orderRepo.createOrder({
      ...orderData,
      user: userId,
      status: "Pending",
    });
  };

  getOrderById = async (id: string) => {
    return await this.orderRepo.getOrderById(id);
  };

  getOrders = async (user: any, query: any) => {
    const params: any = { ...query };

    if (user.role === "Rider") {
      params.riderId = user.userId;
    } else if (user.role === "User") {
      params.userId = user.userId;
    }

    return await this.orderRepo.getOrders(params);
  };

  getOrderSummary = async () => {
    return await this.orderRepo.getOrderSummary();
  };

  cancelOrder = async (id: string, reason?: string) => {
    return await this.orderRepo.cancelOrder(id, reason);
  };

  assignRider = async (id: string, riderId: string) => {
    const rider = await User.findById(riderId);
    if (!rider) {
      throw new apiError(404, "Driver not found");
    }
    if (!rider.isOnline) {
      throw new apiError(400, "Driver is offline. Go online to accept rides.");
    }
    return await this.orderRepo.assignRider(id, riderId);
  };

  updateStatus = async (id: string, status: string) => {
    return await this.orderRepo.updateOrderStatus(id, status);
  };

  addCheckpoint = async (id: string, checkpoint: any) => {
    return await this.orderRepo.addCheckpoint(id, checkpoint);
  };

  submitCompletionProof = async (id: string, completionProof: string) => {
    return await this.orderRepo.setCompletionProof(id, completionProof);
  };

  addReview = async (id: string, rating: number, comment?: string) => {
    return await this.orderRepo.addReview(id, { rating, comment });
  };
}
