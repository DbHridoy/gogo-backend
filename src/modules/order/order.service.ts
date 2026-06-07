import { OrderRepository } from "./order.repository";

export class OrderService {
  constructor(private orderRepo: OrderRepository) {}

  estimatePrice = async (distanceKm: number, durationMin: number, vehicleType?: string) => {
    let rate = 2.5; // default rate per km
    let base = 5.0; // default base fare

    if (vehicleType === "Bike") {
      rate = 1.8;
      base = 3.5;
    } else if (vehicleType === "Truck") {
      rate = 5.0;
      base = 12.0;
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
    } else {
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
