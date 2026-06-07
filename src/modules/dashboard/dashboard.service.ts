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
      status: { $in: ["Accepted", "ArrivedPickup", "InProgress"] },
    }).lean();

    return {
      todayEarnings,
      totalEarnings,
      todayRides: todayRides.length,
      totalRides: allRides.length,
      todayTripsCount: todayRides.length,
      totalTripsCount: allRides.length,
      activeRide,
      hoursOnline: 0,
      averageRating: 5.0,
      acceptanceRate: 100,
    };
  };

  getRiderEarnings = async (riderId: string) => {
    const completedRides = await Order.find({
      rider: riderId,
      status: "Completed",
    })
      .sort({ updatedAt: -1 })
      .lean();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEarnings = completedRides
      .filter((ride) => {
        const rDate = new Date(ride.completedAt || ride.updatedAt);
        return rDate >= todayStart && rDate <= todayEnd;
      })
      .reduce((sum, ride) => sum + (ride.price || 0), 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const weekEarnings = completedRides
      .filter((ride) => new Date(ride.completedAt || ride.updatedAt) >= oneWeekAgo)
      .reduce((sum, ride) => sum + (ride.price || 0), 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const monthEarnings = completedRides
      .filter((ride) => new Date(ride.completedAt || ride.updatedAt) >= oneMonthAgo)
      .reduce((sum, ride) => sum + (ride.price || 0), 0);

    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);

    const pendingEarnings = completedRides
      .filter((ride) => ride.paymentMethod === "Card" && ride.paymentStatus !== "Paid")
      .reduce((sum, ride) => sum + (ride.price || 0), 0);

    // Prepare dailyTrend for last 7 days
    const dailyTrend: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const dayAmount = completedRides
        .filter((ride) => {
          const rDate = new Date(ride.completedAt || ride.updatedAt);
          return rDate >= startOfDay && rDate <= endOfDay;
        })
        .reduce((sum, ride) => sum + (ride.price || 0), 0);

      dailyTrend.push({
        date: dateStr,
        amount: Math.round(dayAmount * 100) / 100,
      });
    }

    const transactions = completedRides.map((ride) => ({
      id: ride._id.toString(),
      type: "ride",
      amount: ride.price,
      status: (ride.paymentMethod === "Cash" || ride.paymentStatus === "Paid") ? "completed" : "pending",
      date: ride.completedAt || ride.updatedAt || new Date(),
      description: `Ride to ${ride.dropoff?.addressLine || "Destination"}`,
      rideId: ride._id.toString(),
    }));

    return {
      total: totalEarnings,
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
      pending: pendingEarnings,
      dailyTrend,
      transactions,
    };
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
