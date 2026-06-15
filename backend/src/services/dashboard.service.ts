import { DashboardRepository, type DashboardSummary } from "../repositories/dashboard.repository";

export class DashboardService {
  constructor(private readonly dashboardRepository = new DashboardRepository()) {}

  getSummary(): Promise<DashboardSummary> {
    return this.dashboardRepository.getSummary();
  }
}
