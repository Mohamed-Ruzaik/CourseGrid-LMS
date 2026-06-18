import type { UserRole } from "./auth";

export type ApprovalUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type InstructorCourseApproval = {
  id: number;
  course_id: number;
  course_title: string;
  instructor_id: number;
  instructor_name: string;
  instructor_email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
};

export type ApprovalSummary = {
  users: ApprovalUser[];
  instructor_course_requests: InstructorCourseApproval[];
};
