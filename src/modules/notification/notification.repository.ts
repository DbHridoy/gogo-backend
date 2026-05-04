import Notification from "./notification.model";

export class NotificationRepository {
  getNotificationsByUser = async (userId: string) => {
    return Notification.find({ forUser: userId }).sort({ createdAt: -1 });
  };

  getNotificationById = async (id: string) => {
    return Notification.findById(id);
  };

  markAsRead = async (id: string) => {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  };

  markAllAsRead = async (userId: string) => {
    await Notification.updateMany({ forUser: userId, isRead: false }, { isRead: true });
    return this.getNotificationsByUser(userId);
  };
}
