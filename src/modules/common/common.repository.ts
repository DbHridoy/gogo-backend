import { buildDynamicSearch } from "../../utils/dynamic-search-utils";
import { Notification } from "./notification.model";
import { logger } from "../../utils/logger";
import User from "../user/user.model";

export class CommonRepository {
  getNotification = async (query: {}) => {
    const { filter, search, options } = buildDynamicSearch(Notification, query);
    const notifications = await Notification.find(
      { ...filter, ...search },
      null,
      options
    );
    return notifications;
  };

  markNotificationRead = async (notificationId: string, userId: string) => {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, forUser: userId, isRead: false },
      { isRead: true },
      { new: true }
    );
    if (updated) {
      return updated;
    }
    return Notification.findOne({ _id: notificationId, forUser: userId });
  };

  getUserStatsById = async (
    userId: string,
    periodType?: string,
    date?: Date
  ) => {
    const user = await User.findById(userId).select(
      "_id fullName email role"
    );
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      fullName: (user as any).fullName,
      email: user.email,
      role: user.role,
      stats: null,
    };
  };
}
