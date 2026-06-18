import { apiClient } from "./client";
import type { ApprovalSummary, ApprovalUser, InstructorCourseApproval } from "../types/approval";

export async function fetchApprovals() {
  const response = await apiClient.get<ApprovalSummary>("/approvals");
  return response.data;
}

export async function approveUser(userId: number) {
  const response = await apiClient.post<ApprovalUser>(`/approvals/users/${userId}/approve`);
  return response.data;
}

export async function suspendUser(userId: number) {
  const response = await apiClient.post<ApprovalUser>(`/approvals/users/${userId}/suspend`);
  return response.data;
}

export async function approveInstructorCourseRequest(requestId: number) {
  const response = await apiClient.post<InstructorCourseApproval>(
    `/approvals/instructor-course-requests/${requestId}/approve`
  );
  return response.data;
}

export async function rejectInstructorCourseRequest(requestId: number) {
  const response = await apiClient.post<InstructorCourseApproval>(
    `/approvals/instructor-course-requests/${requestId}/reject`
  );
  return response.data;
}
