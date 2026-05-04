import { UserRepository } from "./user.repository";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import {
  createUserType,
  saveAddressType,
  updateRiderLocationType,
  updateSavedAddressType,
} from "./user.type";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  createUser = async (userBody: createUserType) => {
    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
      );
    }
    return await this.userRepo.createUser(userBody);
  };

  getUserProfile = async (id: string) => {
    return await this.userRepo.findUserById(id);
  };

  getAllUsers = async (query: any) => {
    return await this.userRepo.getAllUsers(query)
  }
  getUserById = async (id: string) => {
    return await this.userRepo.findUserById(id)
  }

  updateMyProfile = async (id: string, body: any) => {
    return await this.userRepo.updateMyProfile(id, body);
  };

  updateRiderLocation = async (currentUser: any, body: updateRiderLocationType) => {
    if (!currentUser?.userId) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    const user = await this.userRepo.findUserById(currentUser.userId);

    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    if (user.role !== "Rider") {
      throw new apiError(Errors.Forbidden.code, "Only riders can update location");
    }

    if (user.status === "Pending") {
      throw new apiError(
        Errors.Forbidden.code,
        "Rider account is pending admin approval"
      );
    }

    return await this.userRepo.updateUserLocation(currentUser.userId, {
      latitude: body.latitude,
      longitude: body.longitude,
      updatedAt: new Date(),
    });
  };

  updateUser = async (id: string, body: any) => {
    const existingUser = await this.userRepo.findUserById(id);

    if (!existingUser) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    if (body.status) {
      if (existingUser.role !== "Rider") {
        throw new apiError(400, "Status can only be updated for rider accounts");
      }

      if (!["Pending", "Approved"].includes(body.status)) {
        throw new apiError(400, "Invalid rider status");
      }
    }

    return await this.userRepo.updateUser(id, body)
  }

  // getSalesReps = async (query: any) => {
  //   return await this.userRepo.getSalesReps(query)
  // }
  deleteUser = async (id: string) => {
    return await this.userRepo.deleteUser(id)
  }

  getSavedAddresses = async (id: string) => {
    const user = await this.userRepo.findUserById(id);

    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    return user.savedAddresses || [];
  };

  addSavedAddress = async (id: string, body: saveAddressType) => {
    if (body.isDefault) {
      await this.userRepo.clearDefaultSavedAddresses(id);
    }

    const user = await this.userRepo.addSavedAddress(id, body);

    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    return user.savedAddresses;
  };

  updateSavedAddress = async (
    id: string,
    addressId: string,
    body: updateSavedAddressType
  ) => {
    if (body.isDefault) {
      await this.userRepo.clearDefaultSavedAddresses(id);
    }

    const user = await this.userRepo.updateSavedAddress(id, addressId, body);

    if (!user) {
      throw new apiError(Errors.NotFound.code, "Saved address not found");
    }

    return user.savedAddresses;
  };

  deleteSavedAddress = async (id: string, addressId: string) => {
    const existingUser = await this.userRepo.findUserById(id);

    if (!existingUser) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    const addressExists = (existingUser.savedAddresses || []).some(
      (address: any) => String(address._id) === addressId
    );

    if (!addressExists) {
      throw new apiError(Errors.NotFound.code, "Saved address not found");
    }

    const user = await this.userRepo.removeSavedAddress(id, addressId);

    return user?.savedAddresses || [];
  };
}
