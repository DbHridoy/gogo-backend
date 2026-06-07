import Order from "../order/order.model";
import User from "../user/user.model";

export class DashboardService {
  getRiderStats = async (riderId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayRides, allRides] = await Promise.all([
      Order.find({
        rider: riderId,
        status: "Completed",
        updatedAt: { $gte: todayStart, $lte: todayEnd },
      }).lean(),
      Order.find({
        rider: riderId,
        status: "Completed",
      }).lean(),
    ]);

    const todayEarnings = todayRides.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalEarnings = allRides.reduce((sum, order) => sum + (order.price || 0), 0);

    const activeRide = await Order.findOne({
      rider: riderId,
      status: { $in: ["Accepted", "InProgress"] },
    }).lean();

    return {
      todayEarnings,
      totalEarnings,
      todayTripsCount: todayRides.length,
      totalTripsCount: allRides.length,
      activeRide,
    };
  };

  getRiderEarnings = async (riderId: string) => {
    const completedRides = await Order.find({
      rider: riderId,
      status: "Completed",
    })
      .sort({ updatedAt: -1 })
      .lean();

    const earningsLog = completedRides.map((ride) => ({
      orderId: ride._id,
      amount: ride.price,
      date: ride.updatedAt,
      pickup: ride.pickup?.addressLine,
      dropoff: ride.dropoff?.addressLine,
    }));

    return earningsLog;
  };

  getOverview = async () => {
    const [totalUsers, activeRiders, completedOrders] = await Promise.all([
      User.countDocuments({ role: "User" }),
      User.countDocuments({ role: "Rider" }),
      Order.find({ status: "Completed" }).lean(),
    ]);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    return {
      totalUsers,
      totalRevenue,
      activeRiders,
    };
  };

  getUserGrowth = async (year?: string, month?: string) => {
    const matchStage: any = { role: "User" };
    if (year) {
      const start = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
      const end = new Date(Number(year), month ? Number(month) : 12, 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const growth = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return growth.map((g) => ({ date: g._id, count: g.count }));
  };

  getRiderGrowth = async (timeframe?: string) => {
    // Similar to user growth, could implement timeframe filtering
    const growth = await User.aggregate([
      { $match: { role: "Rider" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return growth.map((g) => ({ date: g._id, count: g.count }));
  };

  getRevenueTrend = async (timeframe?: string) => {
    const trend = await Order.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          amount: { $sum: "$price" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trend.map((t) => ({ date: t._id, amount: t.amount }));
  };

  getAdminEarnings = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const [result, total] = await Promise.all([
      Order.find({ status: "Completed" })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("rider", "name firstName lastName email phoneNumber")
        .populate("user", "name firstName lastName email phoneNumber")
        .lean(),
      Order.countDocuments({ status: "Completed" }),
    ]);

    return {
      meta: { total, page, limit },
      result,
    };
  };

  getHotAreas = async (timeframe?: string) => {
    const areas = await Order.aggregate([
      { $match: { "pickup.addressLine": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$pickup.addressLine",
          requestCount: { $sum: 1 },
        },
      },
      { $sort: { requestCount: -1 } },
      { $limit: 10 },
    ]);

    return areas.map((a) => ({ areaName: a._id, requestCount: a.requestCount }));
  };
}
