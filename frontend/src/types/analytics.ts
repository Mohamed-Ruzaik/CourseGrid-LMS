export type AnalyticsSummary = {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  total_assignments: number;
  total_submissions: number;
  total_graded_submissions: number;
  pending_assignments: number;
  completed_lessons: number;
  average_grade: number | null;
};
