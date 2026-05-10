import { Types } from "mongoose";
import User from "./user.model";
import { logger } from "../../utils/logger";

export class UserRepository {
  constructor(private buildDynamicSearch: any) { }

  findUserById = async (id: string) => {
    return await User.findById(id).lean();
  };

  findUserByEmail = async (email: string) => {
    return await User.findOne({ email }).lean();
  };

  findUserByEmailWithPassword = async (email: string) => {
    return await User.findOne({ email }).select("+password").lean();
  };

  findUserByReferralCode = async (referralCode: string) => {
    return await User.findOne({ referralCode: referralCode.toUpperCase() }).lean();
  };

  createUser = async (userBody: any) => {
    logger.info({ userBody }, "UserRepository - createUser");

    const newUser = new User(userBody);
    await newUser.save();

    return newUser;
  };

  getAllUsers = async (query: any) => {
    const { filter, search, options } = this.buildDynamicSearch(User, query);

    const baseQuery = {
      ...filter,
      ...search,
      role: "User",
    };

    const [users, total] = await Promise.all([
      User.find(baseQuery, null, options),
      User.countDocuments(baseQuery),
    ]);

    return { data: users, total };
  };

  getUserStats = async () => {
    const stats = await User.aggregate([
      {
        $match: {
          role: "User",
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
          blockedUsers: {
            $sum: {
              $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          blockedUsers: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        blockedUsers: 0,
      }
    );
  };

  getAllRiders = async (query: any) => {
    const { filter, search, options } = this.buildDynamicSearch(User, query);

    const baseQuery = {
      ...filter,
      ...search,
      role: "Rider",
    };

    const [riders, total] = await Promise.all([
      User.find(baseQuery, null, options),
      User.countDocuments(baseQuery),
    ]);

    return { data: riders, total };
  };

  getRiderStats = async () => {
    const stats = await User.aggregate([
      {
        $match: {
          role: "Rider",
        },
      },
      {
        $group: {
          _id: null,
          totalRiders: { $sum: 1 },
          activeRiders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
          pendingRiders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
            },
          },
          blockedRiders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRiders: 1,
          activeRiders: 1,
          pendingRiders: 1,
          blockedRiders: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalRiders: 0,
        activeRiders: 0,
        pendingRiders: 0,
        blockedRiders: 0,
      }
    );
  };

  updateUserPassword = async (id: Types.ObjectId, hashedPassword: string) => {
    return await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
  };

  updateMyProfile = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };

  updateUser = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };

  updateUserLocation = async (
    id: string,
    location: { latitude: number; longitude: number; updatedAt: Date }
  ) => {
    return await User.findByIdAndUpdate(id, { location }, { new: true });
  };

  addSavedAddress = async (id: string, address: any) => {
    return await User.findByIdAndUpdate(
      id,
      { $push: { savedAddresses: address } },
      { new: true }
    );
  };

  clearDefaultSavedAddresses = async (id: string) => {
    return await User.updateOne(
      { _id: id },
      { $set: { "savedAddresses.$[].isDefault": false } }
    );
  };

  updateSavedAddress = async (id: string, addressId: string, body: any) => {
    const updatePayload = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [`savedAddresses.$.${key}`, value])
    );

    return await User.findOneAndUpdate(
      { _id: id, "savedAddresses._id": addressId },
      { $set: updatePayload },
      { new: true }
    );
  };

  removeSavedAddress = async (id: string, addressId: string) => {
    return await User.findByIdAndUpdate(
      id,
      { $pull: { savedAddresses: { _id: addressId } } },
      { new: true }
    );
  };

  deleteUser = async (id: string) => {
    return await User.findByIdAndDelete(id);
  };

  findUserByPhoneNumber = async (phoneNumber: string) => {
    return await User.findOne({ phoneNumber }).lean();
  };
}
