import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardQuery } from "./dashboard.schema";

export class DashboardService {
  constructor(private dashboardRepository: DashboardRepository) {}

  private getDateRange(query: DashboardQuery) {
    if (query.dateFrom || query.dateTo) {
      return {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : new Date(0),
        dateTo: query.dateTo ? new Date(query.dateTo) : new Date(),
      };
    }

    const now = new Date();
    const dateFrom = new Date(now);

    if (query.groupBy === "monthly") {
      dateFrom.setMonth(now.getMonth() - 11);
      dateFrom.setDate(1);
      dateFrom.setHours(0, 0, 0, 0);
    } else if (query.groupBy === "yearly") {
      dateFrom.setFullYear(now.getFullYear() - 4, 0, 1);
      dateFrom.setHours(0, 0, 0, 0);
    } else if (query.groupBy === "weekly") {
      dateFrom.setDate(now.getDate() - 83);
      dateFrom.setHours(0, 0, 0, 0);
    } else {
      dateFrom.setDate(now.getDate() - 29);
      dateFrom.setHours(0, 0, 0, 0);
    }

    return {
      dateFrom,
      dateTo: now,
    };
  }

  getAdminDashboard = async (currentUser: any, query: DashboardQuery) => {
    if (currentUser.role !== "Admin") {
      throw new apiError(Errors.Forbidden.code, "Only admin can access dashboard data");
    }

    const { dateFrom, dateTo } = this.getDateRange(query);

    const filters = {
      ...query,
      dateFrom,
      dateTo,
      recentLimit: query.recentLimit ?? 10,
      hotAreaLimit: query.hotAreaLimit ?? 5,
      groupBy: query.groupBy ?? "daily",
    };

    const [
      overview,
      revenueTrend,
      userGrowth,
      riderGrowth,
      incomeGrowth,
      recentOrders,
      earnings,
      hotAreas,
      paymentStatusBreakdown,
    ] =
      await Promise.all([
        this.dashboardRepository.getOverview(filters),
        this.dashboardRepository.getRevenueTrend(filters),
        this.dashboardRepository.getUserGrowth(filters),
        this.dashboardRepository.getRiderGrowth(filters),
        this.dashboardRepository.getIncomeGrowth(filters),
        this.dashboardRepository.getRecentOrders(filters),
        this.dashboardRepository.getEarnings(filters),
        this.dashboardRepository.getHotAreas(filters),
        this.dashboardRepository.getPaymentStatusBreakdown(filters),
      ]);

    return {
      filters: {
        ...query,
        dateFrom,
        dateTo,
      },
      overview,
      revenueTrend,
      userGrowth,
      riderGrowth,
      incomeGrowth,
      recentOrders: recentOrders.map((order: any) => ({
        orderId: String(order._id),
        customer: order.user
          ? {
              id: String(order.user._id),
              fullName: `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim(),
              phoneNumber: order.user.phoneNumber,
            }
          : null,
        status: order.status,
        amount: order.price,
        paymentStatus: order.paymentStatus,
        area:
          order.pickup?.label ||
          order.pickup?.addressLine ||
          order.dropoff?.label ||
          order.dropoff?.addressLine ||
          "Unknown Area",
        createdAt: order.createdAt,
      })),
      earnings: earnings.map((order: any) => ({
        fullName: order.user
          ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
          : "Unknown User",
        date: order.createdAt,
        commission: Number((order.price * 0.1).toFixed(2)),
        parcel: String(order._id),
      })),
      hotAreas: hotAreas.map((area: any) => ({
        areaName: area.area,
        numberOfRiders: area.totalRiders,
        numberOfOrders: area.totalOrders,
      })),
      paymentStatusBreakdown,
    };
  };
}
