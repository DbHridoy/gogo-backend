import { Types } from "mongoose";
import User from "./user.model";
import { logger } from "../../utils/logger";

export class UserRepository {
  constructor(private buildDynamicSearch: any) { }

  findUserById = async (id: string) => {
    return await User.findById(id).populate("salesRep productionManager admin", "_id").lean();
  };

  findUserByEmail = async (email: string) => {
    const user = await User.findOne({ email })
      .populate([
        { path: "salesRep", select: "_id -userId" },
        { path: "productionManager", select: "_id -userId" },
        { path: "admin", select: "_id -userId" },
      ])
      .lean();

    return user;
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
      role: { $ne: "admin" },
      ...filter,
      ...search,
    };

    // Run both queries concurrently
    const [users, total] = await Promise.all([
      User.find(baseQuery, null, options).populate(
        "salesRep productionManager admin"
      ),
      User.countDocuments(baseQuery),
    ]);

    return { data: users, total };
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

  deleteUser = async (id: string) => {
    return await User.findByIdAndDelete(id);
  };

  findUserByPhoneNumber = async (phoneNumber: string) => {
    return await User.findOne({ phoneNumber });
  };
}
