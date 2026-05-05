import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { createNotification } from "../../utils/create-notification-utils";
import { CreateReportType, ResolveReportType } from "./report.type";
import { ReportRepository } from "./report.repository";

export class ReportService {
  constructor(private reportRepository: ReportRepository) {}

  createReport = async (currentUser: any, payload: CreateReportType) => {
    if (!currentUser?.userId) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    if (!["User", "Rider"].includes(currentUser.role)) {
      throw new apiError(
        Errors.Forbidden.code,
        "Only users and riders can submit reports"
      );
    }

    return this.reportRepository.createReport({
      reporter: currentUser.userId,
      reporterRole: currentUser.role,
      title: payload.title,
      description: payload.description,
    });
  };

  getReports = async (currentUser: any, query: any) => {
    if (!currentUser?.userId) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    return this.reportRepository.getReports(query, currentUser);
  };

  getReportById = async (currentUser: any, id: string) => {
    const report = await this.reportRepository.getReportById(id);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Report not found");
    }

    if (
      currentUser.role !== "Admin" &&
      String((report as any).reporter?._id || (report as any).reporter) !== currentUser.userId
    ) {
      throw new apiError(Errors.Forbidden.code, "You do not have access to this report");
    }

    return report;
  };

  resolveReport = async (currentUser: any, id: string, payload: ResolveReportType) => {
    if (currentUser.role !== "Admin") {
      throw new apiError(Errors.Forbidden.code, "Only admin can resolve reports");
    }

    const existingReport = await this.reportRepository.getReportById(id);

    if (!existingReport) {
      throw new apiError(Errors.NotFound.code, "Report not found");
    }

    if ((existingReport as any).status === "Resolved") {
      throw new apiError(400, "Report is already resolved");
    }

    const updatedReport = await this.reportRepository.updateReport(id, {
      status: "Resolved",
      resolutionNote: payload.resolutionNote || "",
      resolvedAt: new Date(),
      resolvedBy: currentUser.userId,
    });

    const reporterId = String((existingReport as any).reporter?._id || (existingReport as any).reporter);
    await createNotification({
      forUser: reporterId,
      type: "ReportResolved",
      message: `Your reported issue "${(existingReport as any).title}" has been resolved.`,
    });

    return updatedReport;
  };
}
