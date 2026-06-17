import type { UserRole } from "../types/auth";

export function dashboardPathForRole(role: UserRole) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "instructor") {
    return "/instructor/dashboard";
  }

  return "/student/dashboard";
}
