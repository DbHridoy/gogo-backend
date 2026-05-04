import Order from "../order/order.model";
import Payment from "../payment/payment.model";
import User from "../user/user.model";

type DashboardFilters = {
  dateFrom: Date;
  dateTo: Date;
  status?: string;
  area?: string;
  search?: string;
  recentLimit: number;
  hotAreaLimit: number;
  groupBy: "daily" | "weekly" | "monthly";
};

export class DashboardRepository {
  private buildOrderMatch(filters: DashboardFilters) {
    const match: Record<string, any> = {
      createdAt: {
        $gte: filters.dateFrom,
        $lte: filters.dateTo,
      },
    };

    if (filters.status) {
      match.status = filters.status;
    }

    if (filters.area) {
      match.$or = [
        { "pickup.label": filters.area },
        { "pickup.addressLine": filters.area },
        { "dropoff.label": filters.area },
        { "dropoff.addressLine": filters.area },
      ];
    }

    if (filters.search) {
      const regex = new RegExp(filters.search, "i");
      const searchConditions = [
        { "pickup.label": regex },
        { "pickup.addressLine": regex },
        { "dropoff.label": regex },
        { "dropoff.addressLine": regex },
      ];

      if (match.$or) {
        match.$and = [{ $or: match.$or }, { $or: searchConditions }];
        delete match.$or;
      } else {
        match.$or = searchConditions;
      }
    }

    return match;
  }

  private buildPeriodExpression(groupBy: DashboardFilters["groupBy"]) {
    if (groupBy === "weekly") {
      return {
        $dateToString: {
          format: "%G-W%V",
          date: "$createdAt",
        },
      };
    }

    if (groupBy === "monthly") {
      return {
        $dateToString: {
          format: "%Y-%m",
          date: "$createdAt",
        },
      };
    }

    return {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$createdAt",
      },
    };
  }

  getOverview = async (filters: DashboardFilters) => {
    const orderMatch = this.buildOrderMatch(filters);
    const activeStatuses = ["Pending", "Accepted", "ArrivedPickup", "InProgress"];

    const [orderStats, userStats] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $addFields: {
            areaName: {
              $ifNull: [
                "$pickup.label",
                {
                  $ifNull: ["$pickup.addressLine", "Unknown Area"],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            activeRiders: {
              $addToSet: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$rider", null] },
                      { $ne: [{ $type: "$rider" }, "missing"] },
                    ],
                  },
                  "$rider",
                  "$$REMOVE",
                ],
              },
            },
            areas: { $addToSet: "$areaName" },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$price", 0],
              },
            },
            activeOrdersCurrentPeriod: {
              $sum: {
                $cond: [{ $in: ["$status", activeStatuses] }, 1, 0],
              },
            },
            completedOrdersCurrentPeriod: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },
            paidOrdersCurrentPeriod: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0],
              },
            },
            totalOrderValue: { $sum: "$price" },
          },
        },
      ]),
      Promise.all([
        User.countDocuments({ role: "User" }),
        User.countDocuments({ role: "Rider" }),
        Order.distinct("user", orderMatch),
      ]),
    ]);

    const orderMetrics = orderStats[0] || {
      totalOrders: 0,
      activeRiders: [],
      areas: [],
      totalRevenue: 0,
      activeOrdersCurrentPeriod: 0,
      completedOrdersCurrentPeriod: 0,
      paidOrdersCurrentPeriod: 0,
      totalOrderValue: 0,
    };

    return {
      totalUsers: userStats[0],
      totalRiders: userStats[1],
      totalOrders: orderMetrics.totalOrders,
      totalEarning: orderMetrics.totalRevenue,
      totalRevenue: orderMetrics.totalRevenue,
      activeDrivers: orderMetrics.activeRiders.length,
      avgOrdersPerArea:
        orderMetrics.areas.length > 0
          ? Number((orderMetrics.totalOrders / orderMetrics.areas.length).toFixed(2))
          : 0,
      activeUsersCurrentPeriod: userStats[2].length,
      activeOrdersCurrentPeriod: orderMetrics.activeOrdersCurrentPeriod,
      completedOrdersCurrentPeriod: orderMetrics.completedOrdersCurrentPeriod,
      paidOrdersCurrentPeriod: orderMetrics.paidOrdersCurrentPeriod,
      averageOrderValue:
        orderMetrics.totalOrders > 0
          ? Number((orderMetrics.totalOrderValue / orderMetrics.totalOrders).toFixed(2))
          : 0,
    };
  };

  getRevenueTrend = async (filters: DashboardFilters) => {
    const orderMatch = this.buildOrderMatch(filters);

    return Order.aggregate([
      {
        $match: {
          ...orderMatch,
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: this.buildPeriodExpression(filters.groupBy),
          revenue: { $sum: "$price" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: "$_id",
          revenue: 1,
          orders: 1,
        },
      },
    ]);
  };

  getRecentOrders = async (filters: DashboardFilters) => {
    const orderMatch = this.buildOrderMatch(filters);

    return Order.find(orderMatch)
      .populate("user", "firstName lastName phoneNumber")
      .sort({ createdAt: -1 })
      .limit(filters.recentLimit)
      .lean();
  };

  getHotAreas = async (filters: DashboardFilters) => {
    const orderMatch = this.buildOrderMatch(filters);

    return Order.aggregate([
      { $match: orderMatch },
      {
        $addFields: {
          areaName: {
            $ifNull: [
              "$pickup.label",
              {
                $ifNull: ["$pickup.addressLine", "Unknown Area"],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$areaName",
          totalOrders: { $sum: 1 },
          riders: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$rider", null] },
                    { $ne: [{ $type: "$rider" }, "missing"] },
                  ],
                },
                "$rider",
                "$$REMOVE",
              ],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$price", 0],
            },
          },
          averageLatitude: { $avg: "$pickup.latitude" },
          averageLongitude: { $avg: "$pickup.longitude" },
        },
      },
      { $sort: { totalOrders: -1, totalRevenue: -1, _id: 1 } },
      { $limit: filters.hotAreaLimit },
      {
        $project: {
          _id: 0,
          area: "$_id",
          totalOrders: 1,
          totalRiders: { $size: "$riders" },
          totalRevenue: 1,
          center: {
            latitude: "$averageLatitude",
            longitude: "$averageLongitude",
          },
        },
      },
    ]);
  };

  getPaymentStatusBreakdown = async (filters: DashboardFilters) => {
    return Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: filters.dateFrom,
            $lte: filters.dateTo,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          amount: 1,
        },
      },
    ]);
  };
}
