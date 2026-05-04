import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { NotificationRepository } from "./notification.repository";

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  getMyNotifications = async (currentUser: any) => {
    if (!currentUser?.userId) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    return this.notificationRepository.getNotificationsByUser(currentUser.userId);
  };

  markAsRead = async (currentUser: any, id: string) => {
    const notification = await this.notificationRepository.getNotificationById(id);

    if (!notification) {
      throw new apiError(Errors.NotFound.code, "Notification not found");
    }

    if (String(notification.forUser) !== currentUser.userId) {
      throw new apiError(
        Errors.Forbidden.code,
        "You do not have access to this notification"
      );
    }

    return this.notificationRepository.markAsRead(id);
  };

  markAllAsRead = async (currentUser: any) => {
    if (!currentUser?.userId) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    return this.notificationRepository.markAllAsRead(currentUser.userId);
  };
}
