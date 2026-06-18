export type Assignment = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  submitted: boolean;
  grade: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentPayload = {
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
};

export type Submission = {
  id: number;
  assignment_id: number;
  student_id: number;
  content: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export type AssignmentStudentSubmission = {
  student_id: number;
  student_name: string;
  student_email: string;
  submitted: boolean;
  submission: Submission | null;
};

export type SubmissionPayload = {
  content: string;
};

export type GradePayload = {
  grade: number;
  feedback: string;
};
