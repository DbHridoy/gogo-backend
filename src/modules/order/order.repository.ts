import Order from "./order.model";

export class OrderRepository {
  countOrdersByUser = async (userId: string) => {
    return Order.countDocuments({ user: userId });
  };

  createOrder = async (payload: any) => {
    const order = new Order(payload);
    await order.save();
    return order;
  };

  getAllOrders = async (query: any) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.userId) {
      filter.user = query.userId;
    }

    if (query.riderId) {
      filter.rider = query.riderId;
    }

    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "firstName lastName phoneNumber role")
        .populate("rider", "firstName lastName phoneNumber role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  };

  getOrderById = async (id: string) => {
    return Order.findById(id)
      .populate("user", "firstName lastName phoneNumber role")
      .populate("rider", "firstName lastName phoneNumber role");
  };

  updateOrder = async (id: string, payload: any) => {
    return Order.findByIdAndUpdate(id, payload, { new: true })
      .populate("user", "firstName lastName phoneNumber role")
      .populate("rider", "firstName lastName phoneNumber role");
  };

  deleteOrder = async (id: string) => {
    return Order.findByIdAndDelete(id);
  };
}
