import { apiClient } from "./client";
import type { AdminUser, AdminUserPayload } from "../types/user";

export async function fetchAdminUsers(search?: string) {
  const response = await apiClient.get<AdminUser[]>("/users", {
    params: search?.trim() ? { search: search.trim() } : undefined
  });
  return response.data;
}

export async function fetchAdminUser(userId: string | number) {
  const response = await apiClient.get<AdminUser>(`/users/${userId}`);
  return response.data;
}

export async function createAdminUser(payload: AdminUserPayload & { password: string }) {
  const response = await apiClient.post<AdminUser>("/users", payload);
  return response.data;
}

export async function updateAdminUser(userId: number, payload: AdminUserPayload) {
  const response = await apiClient.put<AdminUser>(`/users/${userId}`, payload);
  return response.data;
}
