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
      role: { $ne: "Admin" },
      ...filter,
      ...search,
    };

    const [users, total] = await Promise.all([
      User.find(baseQuery, null, options),
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
