import Report from "./report.model";

export class ReportRepository {
  createReport = async (payload: any) => {
    const report = new Report(payload);
    await report.save();
    return report;
  };

  getReportById = async (id: string) => {
    return Report.findById(id)
      .populate("reporter", "firstName lastName email phoneNumber role")
      .populate("resolvedBy", "firstName lastName email role");
  };

  getReports = async (query: any, currentUser: any) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (currentUser.role !== "Admin") {
      filter.reporter = currentUser.userId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.reporterRole) {
      filter.reporterRole = query.reporterRole;
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const [data, total] = await Promise.all([
      Report.find(filter)
        .populate("reporter", "firstName lastName email phoneNumber role")
        .populate("resolvedBy", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  };

  updateReport = async (id: string, payload: any) => {
    return Report.findByIdAndUpdate(id, payload, { new: true })
      .populate("reporter", "firstName lastName email phoneNumber role")
      .populate("resolvedBy", "firstName lastName email role");
  };
}
