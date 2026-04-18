import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { env } from "../../config/env";
import { OrderRepository } from "../order/order.repository";
import { PaymentRepository } from "./payment.repository";

type PaymentStatus =
  | "Pending"
  | "Initiated"
  | "Authorized"
  | "Captured"
  | "Failed"
  | "Cancelled"
  | "Refunded";

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private orderRepo: OrderRepository
  ) {}

  private getTapBaseUrl = () => {
    const baseUrl = (env.TAP_API_BASE_URL || "https://api.tap.company/v2").trim();

    try {
      return new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    } catch {
      throw new apiError(500, "TAP_API_BASE_URL is invalid");
    }
  };

  private mapTapStatus = (tapStatus: string): PaymentStatus => {
    const normalized = (tapStatus || "").toUpperCase();

    if (normalized === "CAPTURED") return "Captured";
    if (normalized === "AUTHORIZED") return "Authorized";
    if (normalized === "INITIATED") return "Initiated";
    if (normalized === "REFUNDED") return "Refunded";
    if (["CANCELLED", "VOID", "ABANDONED"].includes(normalized)) {
      return "Cancelled";
    }

    return "Failed";
  };

  private callTap = async (
    path: string,
    options: RequestInit
  ): Promise<Record<string, any>> => {
    const secretKey = (env.TAP_SECRET_KEY || "").trim();

    if (!secretKey) {
      throw new apiError(500, "TAP_SECRET_KEY is not configured");
    }

    const url = new URL(path.replace(/^\//, ""), this.getTapBaseUrl());

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const rawBody = await response.text();
    let parsedBody: Record<string, any> = {};

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = { message: rawBody };
      }
    }

    if (!response.ok) {
      throw new apiError(
        502,
        parsedBody?.message || "Tap gateway request failed"
      );
    }

    return parsedBody;
  };

  private updateOrderPaymentStatus = async (
    orderId: string,
    paymentStatus: PaymentStatus
  ) => {
    const orderPaymentStatus = paymentStatus === "Captured" ? "Paid" : "Unpaid";
    await this.orderRepo.updateOrder(orderId, { paymentStatus: orderPaymentStatus });
  };

  initiatePayment = async (currentUser: any, payload: any) => {
    const order = await this.orderRepo.getOrderById(payload.orderId);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    const orderUserId = String(order.user?._id || order.user);
    const canPay = currentUser.role === "Admin" || orderUserId === currentUser.userId;

    if (!canPay) {
      throw new apiError(Errors.Forbidden.code, "You cannot pay for this order");
    }

    if (order.paymentStatus === "Paid") {
      throw new apiError(400, "Order is already paid");
    }

    const amount = payload.amount ?? order.price;
    if (amount <= 0) {
      throw new apiError(400, "Amount must be greater than 0");
    }

    const currency = (payload.currency || "AED").toUpperCase();
    const customer = payload.customer || {};
    const orderUser = order.user as any;

    const tapPayload = {
      amount,
      currency,
      threeDSecure: true,
      save_card: false,
      description:
        payload.description || `Payment for order ${String(order._id)}`,
      customer: {
        first_name: customer.firstName || orderUser?.firstName || "Customer",
        last_name: customer.lastName || orderUser?.lastName || "User",
        email: customer.email || orderUser?.email || "no-reply@example.com",
        phone: {
          country_code: customer.phoneCountryCode || "971",
          number: customer.phoneNumber || orderUser?.phoneNumber || "00000000",
        },
      },
      source: {
        id: payload.sourceId || "src_all",
      },
      redirect: {
        url: payload.redirectUrl || env.TAP_REDIRECT_URL,
      },
      metadata: {
        orderId: String(order._id),
        userId: String(currentUser.userId),
      },
    };

    const tapCharge = await this.callTap("/charges", {
      method: "POST",
      body: JSON.stringify(tapPayload),
    });

    const status = this.mapTapStatus(tapCharge.status);

    const payment = await this.paymentRepo.createPayment({
      order: order._id,
      user: order.user?._id || order.user,
      amount,
      currency,
      gateway: "Tap",
      status,
      gatewayChargeId: tapCharge.id,
      description: tapPayload.description,
      redirectUrl: tapPayload.redirect.url,
      gatewayResponse: tapCharge,
    });

    await this.updateOrderPaymentStatus(String(order._id), status);

    return {
      payment,
      chargeId: tapCharge.id,
      tapStatus: tapCharge.status,
      transactionUrl: tapCharge?.transaction?.url || null,
      response: tapCharge,
    };
  };

  verifyPaymentByChargeId = async (currentUser: any, chargeId: string) => {
    const tapCharge = await this.callTap(`/charges/${chargeId}`, {
      method: "GET",
    });

    const payment = await this.paymentRepo.findByGatewayChargeId(chargeId);

    if (!payment) {
      throw new apiError(Errors.NotFound.code, "Payment not found for this chargeId");
    }

    const paymentUserId = String(payment.user?._id || payment.user);
    const canView = currentUser.role === "Admin" || paymentUserId === currentUser.userId;

    if (!canView) {
      throw new apiError(Errors.Forbidden.code, "You cannot access this payment");
    }

    const status = this.mapTapStatus(tapCharge.status);

    const updatedPayment = await this.paymentRepo.updateByGatewayChargeId(chargeId, {
      status,
      gatewayResponse: tapCharge,
    });

    await this.updateOrderPaymentStatus(String(payment.order?._id || payment.order), status);

    return {
      payment: updatedPayment,
      tapStatus: tapCharge.status,
      response: tapCharge,
    };
  };

  handleTapWebhook = async (payload: any) => {
    const chargeId = payload?.id || payload?.data?.id || payload?.charge?.id;

    if (!chargeId) {
      throw new apiError(400, "Tap webhook missing charge id");
    }

    const tapCharge = await this.callTap(`/charges/${chargeId}`, {
      method: "GET",
    });

    const status = this.mapTapStatus(tapCharge.status);

    const payment = await this.paymentRepo.updateByGatewayChargeId(chargeId, {
      status,
      gatewayResponse: tapCharge,
    });

    if (payment) {
      await this.updateOrderPaymentStatus(
        String(payment.order?._id || payment.order),
        status
      );
    }

    return {
      chargeId,
      status,
      updated: Boolean(payment),
    };
  };

  getPaymentById = async (currentUser: any, id: string) => {
    const payment = await this.paymentRepo.getPaymentById(id);

    if (!payment) {
      throw new apiError(Errors.NotFound.code, "Payment not found");
    }

    const paymentUserId = String(payment.user?._id || payment.user);
    const canView = currentUser.role === "Admin" || paymentUserId === currentUser.userId;

    if (!canView) {
      throw new apiError(Errors.Forbidden.code, "You cannot access this payment");
    }

    return payment;
  };

  getPaymentsByOrderId = async (currentUser: any, orderId: string) => {
    const order = await this.orderRepo.getOrderById(orderId);

    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    const orderUserId = String(order.user?._id || order.user);
    const canView = currentUser.role === "Admin" || orderUserId === currentUser.userId;

    if (!canView) {
      throw new apiError(Errors.Forbidden.code, "You cannot access this order payments");
    }

    return this.paymentRepo.getPaymentsByOrderId(orderId);
  };

  getMyPaymentHistory = async (currentUser: any, query: any) => {
    if (currentUser.role === "Admin") {
      if (query.userId) {
        return this.paymentRepo.getPaymentsByUserId(query.userId, query);
      }

      throw new apiError(400, "userId is required for admin payment history lookup");
    }

    return this.paymentRepo.getPaymentsByUserId(currentUser.userId, query);
  };
}
