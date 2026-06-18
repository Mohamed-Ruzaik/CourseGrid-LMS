import type { UserRole } from "./auth";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  enrolled_course_ids: number[];
  instructor_course_ids: number[];
};

export type AdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  is_active: boolean;
  enrolled_course_ids: number[];
  instructor_course_ids: number[];
};
