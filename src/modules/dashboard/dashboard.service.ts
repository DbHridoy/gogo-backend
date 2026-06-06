import Order from "../order/order.model";

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
}
