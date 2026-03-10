import Payment from "./payment.model";

export class PaymentRepository {
  getPaymentsByUserId = async (userId: string, query: any) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };

    if (query.status) {
      filter.status = query.status;
    }

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .populate("user", "firstName lastName email phoneNumber role")
        .populate("order")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  };

  createPayment = async (payload: any) => {
    const payment = new Payment(payload);
    await payment.save();
    return payment;
  };

  getPaymentById = async (id: string) => {
    return Payment.findById(id)
      .populate("user", "firstName lastName email phoneNumber role")
      .populate("order");
  };

  getPaymentsByOrderId = async (orderId: string) => {
    return Payment.find({ order: orderId })
      .populate("user", "firstName lastName email phoneNumber role")
      .populate("order")
      .sort({ createdAt: -1 });
  };

  findByGatewayChargeId = async (gatewayChargeId: string) => {
    return Payment.findOne({ gatewayChargeId })
      .populate("user", "firstName lastName email phoneNumber role")
      .populate("order");
  };

  updatePaymentById = async (id: string, payload: any) => {
    return Payment.findByIdAndUpdate(id, payload, { new: true })
      .populate("user", "firstName lastName email phoneNumber role")
      .populate("order");
  };

  updateByGatewayChargeId = async (gatewayChargeId: string, payload: any) => {
    return Payment.findOneAndUpdate({ gatewayChargeId }, payload, { new: true })
      .populate("user", "firstName lastName email phoneNumber role")
      .populate("order");
  };
}
