export type CourseStatus = "draft" | "published" | "archived";

export type Course = {
  id: number;
  title: string;
  description: string;
  status: CourseStatus;
  instructor_id: number;
  instructor_ids: number[];
  created_at: string;
  updated_at: string;
  is_enrolled: boolean;
  instructor_request_status: "pending" | "approved" | "rejected" | null;
};

export type CoursePayload = {
  title: string;
  description: string;
  status: CourseStatus;
  instructor_id?: number;
  instructor_ids?: number[];
};

export type Enrollment = {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
};

export type InstructorCourseRequest = {
  id: number;
  course_id: number;
  instructor_id: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
};
