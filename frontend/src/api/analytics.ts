import { apiClient } from "./client";
import type { AnalyticsSummary } from "../types/analytics";

export async function fetchAnalyticsSummary() {
  const response = await apiClient.get<AnalyticsSummary>("/analytics/summary");
  return response.data;
}
