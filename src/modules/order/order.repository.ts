import { Types } from "mongoose";
import Order from "./order.model";

export class OrderRepository {
  createOrder = async (orderData: any) => {
    const order = new Order(orderData);
    await order.save();
    return order;
  };

  getOrderById = async (id: string) => {
    return await Order.findById(id).populate("user rider").lean();
  };

  getOrders = async (query: { userId?: string; riderId?: string; status?: string; scope?: string; page?: number; limit?: number }) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.scope === "available") {
      filter.status = "Pending";
      filter.rider = { $exists: false };
    } else if (query.riderId) {
      filter.rider = query.riderId;
    } else if (query.userId) {
      filter.user = query.userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user rider")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { data: orders, total };
  };

  getOrderSummary = async () => {
    const summary = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      inProgress: 0,
      accepted: 0
    };

    summary.forEach((item) => {
      const status = item._id.toLowerCase();
      if (status === "pending") result.pending = item.count;
      else if (status === "completed") result.completed = item.count;
      else if (status === "cancelled") result.cancelled = item.count;
      else if (status === "inprogress") result.inProgress = item.count;
      else if (status === "accepted") result.accepted = item.count;
    });

    return result;
  };

  updateOrderStatus = async (id: string, status: string) => {
    return await Order.findByIdAndUpdate(id, { status }, { new: true });
  };

  assignRider = async (id: string, riderId: string) => {
    return await Order.findByIdAndUpdate(
      id,
      { rider: riderId, status: "Accepted" },
      { new: true }
    );
  };

  addCheckpoint = async (id: string, checkpoint: any) => {
    const order = await Order.findById(id);
    if (!order) return null;

    const updateQuery: any = {
      $push: { checkpoints: checkpoint },
    };

    if (checkpoint.pointType === "pickup") {
      updateQuery.$set = {
        status: "ArrivedPickup",
        pickupReachedAt: checkpoint.timestamp || new Date(),
      };
    } else if (checkpoint.pointType === "dropoff") {
      updateQuery.$set = {
        status: "Completed",
        completedAt: checkpoint.timestamp || new Date(),
      };
    } else if (checkpoint.pointType === "stoppage" && checkpoint.stoppageId) {
      updateQuery.$set = {
        status: "InProgress",
        "stoppages.$[elem].reachedAt": checkpoint.timestamp || new Date(),
      };
      if (!order.tripStartedAt) {
        updateQuery.$set.tripStartedAt = new Date();
      }
    }

    const arrayFilters = checkpoint.pointType === "stoppage" && checkpoint.stoppageId
      ? [{ "elem._id": checkpoint.stoppageId }]
      : undefined;

    return await Order.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, arrayFilters }
    );
  };

  addReview = async (id: string, review: { rating: number; comment?: string }) => {
    return await Order.findByIdAndUpdate(id, { review }, { new: true });
  };

  cancelOrder = async (id: string, reason?: string) => {
    return await Order.findByIdAndUpdate(
      id,
      { status: "Cancelled", cancellationReason: reason },
      { new: true }
    );
  };

  setCompletionProof = async (id: string, completionProof: string) => {
    return await Order.findByIdAndUpdate(id, { completionProof }, { new: true });
  };
}
