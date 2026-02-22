import { CommonRepository } from "./common.repository";
import { SalesRepRepository } from "../sales-rep/sales-rep.repository";
import { getFiscalPeriods } from "../../utils/fiscalPeriods";
import { logger } from "../../utils/logger";
import { Types } from "mongoose";
import { ProductionManagerRepository } from "../production-manager/production-manager.repository";

export class CommonService {
  constructor(
    private readonly commonRepository: CommonRepository,
    private readonly salesRepRepo: SalesRepRepository,
    private readonly productionManagerRepo: ProductionManagerRepository
  ) { }

  generateSequentialId = async (prefix: string, counterName: string) => {
    const id = await this.commonRepository.generateSequentialId(
      prefix,
      counterName
    );
    return id;
  };

  createCluster = async (clusterName: string) => {
    const cluster = await this.commonRepository.createCluster(clusterName);
    return cluster;
  };

  getVariable = async () => {
    const variable = await this.commonRepository.getVariable();
    return variable;
  };

  upsertVariable = async (variables: any) => {
    return this.commonRepository.upsertVariable(variables);
  };

  getCluster = async () => {
    const clusters = await this.commonRepository.getCluster();
    return clusters;
  };

  getNotification = async (query: any) => {
    const notifications = await this.commonRepository.getNotification(query);
    return notifications;
  };

  markNotificationRead = async (notificationId: string, userId: string) => {
    return this.commonRepository.markNotificationRead(notificationId, userId);
  };

  getAdminStats = async (periodType?: string, date?: Date) => {
    const stats = await this.commonRepository.getAdminStats(periodType, date);
    return stats;
  };

  getSummaryStats = async (periodType?: string, date?: Date) => {
    return this.commonRepository.getSummaryStats(periodType, date);
  };

  getSalesRepStats = async (
    id: string,
    periodType?: string,
    date?: Date
  ) => {
    const stats = await this.commonRepository.getSalesRepStats(
      id,
      periodType,
      date
    );
    return stats;
  };

  getSalesRepPeriodStats = async (
    userId: string,
    periodType: string,
    date: Date
  ) => {
    const stats = await this.commonRepository.getSalesRepPeriodStats(
      userId,
      periodType,
      date
    );
    return stats;
  };

  getSalesRepLeaderboard = async (periodType?: string, date?: Date) => {
    const stats = await this.salesRepRepo.getLeaderboard(periodType, date);
    return stats;
  };

  getMyStats = async (user: any, periodType?: string, date?: Date) => {
    if (user.role === 'Sales Rep') {
      return this.commonRepository.getSalesRepPersonalStats(
        user.userId,
        periodType,
        date
      );
    }
    else if (user.role === 'Production Manager') {
      logger.info({ user }, "CommonService.getMyStats")
      const productionManager = await this.productionManagerRepo.findByUserId(user.userId);
      logger.info({ productionManager }, "CommonService.getMyStats")
      if (!productionManager) return null;
      const [profile, jobStats] = await Promise.all([
        this.productionManagerRepo.getProductionManagerProfile(
          productionManager._id
        ),
        this.commonRepository.getProductionManagerJobStats(
          user.userId,
          periodType,
          date
        ),
      ]);
      return {
        ...(profile ? profile.toObject() : {}),
        ...jobStats,
      };
    }
    else if (user.role === 'Admin') {
      return this.commonRepository.getAdminStats(periodType, date);
    }
    return null;
  };

  getUserStatsById = async (userId: string, periodType?: string, date?: Date) => {
    return this.commonRepository.getUserStatsById(userId, periodType, date);
  };

  createSalesRepPayment = async (paymentInfo: any) => {
    const payment = await this.commonRepository.createSalesRepPayment(
      paymentInfo
    );
    if (payment?.salesRepId && payment?.amount) {
      await this.salesRepRepo.updateCommissionPaid(
        payment.salesRepId,
        Number(payment.amount || 0)
      );
    }
    return payment;
  };

  getSalesRepPayments = async (salesRepId: string, query: any) => {
    return this.commonRepository.getSalesRepPayments(salesRepId, query);
  };

  deleteSalesRepPayment = async (paymentId: string) => {
    const payment = await this.commonRepository.getSalesRepPaymentById(
      paymentId
    );
    const deleted = await this.commonRepository.deleteSalesRepPayment(
      paymentId
    );
    if (payment?.salesRepId && payment?.amount) {
      await this.salesRepRepo.updateCommissionPaid(
        payment.salesRepId,
        -Number(payment.amount || 0)
      );
    }
    return deleted;
  };

  updateSalesRepPayment = async (paymentId: string, paymentInfo: any) => {
    const existing = await this.commonRepository.getSalesRepPaymentById(
      paymentId
    );
    const updated = await this.commonRepository.updateSalesRepPayment(
      paymentId,
      paymentInfo
    );
    const prevSalesRepId = existing?.salesRepId?.toString();
    const nextSalesRepId = updated?.salesRepId?.toString();
    const prevAmount = Number(existing?.amount || 0);
    const nextAmount = Number(updated?.amount || 0);

    if (prevSalesRepId && nextSalesRepId && prevSalesRepId !== nextSalesRepId) {
      await this.salesRepRepo.updateCommissionPaid(
        prevSalesRepId as any,
        -prevAmount
      );
      await this.salesRepRepo.updateCommissionPaid(
        nextSalesRepId as any,
        nextAmount
      );
    } else if (nextSalesRepId) {
      const delta = nextAmount - prevAmount;
      if (delta !== 0) {
        await this.salesRepRepo.updateCommissionPaid(
          nextSalesRepId as any,
          delta
        );
      }
    }
    return updated;
  };

}
