import { apiClient } from "./client";
import type {
  Assignment,
  AssignmentStudentSubmission,
  AssignmentPayload,
  GradePayload,
  Submission,
  SubmissionPayload
} from "../types/assignment";

export async function fetchCourseAssignments(courseId: string | number) {
  const response = await apiClient.get<Assignment[]>(`/courses/${courseId}/assignments`);
  return response.data;
}

export async function createAssignment(courseId: string | number, payload: AssignmentPayload) {
  const response = await apiClient.post<Assignment>(`/courses/${courseId}/assignments`, payload);
  return response.data;
}

export async function updateAssignment(
  assignmentId: number,
  payload: Partial<AssignmentPayload>
) {
  const response = await apiClient.put<Assignment>(`/assignments/${assignmentId}`, payload);
  return response.data;
}

export async function deleteAssignment(assignmentId: number) {
  await apiClient.delete(`/assignments/${assignmentId}`);
}

export async function submitAssignment(assignmentId: number, payload: SubmissionPayload) {
  const response = await apiClient.post<Submission>(`/assignments/${assignmentId}/submit`, payload);
  return response.data;
}

export async function fetchAssignmentSubmissions(assignmentId: number) {
  const response = await apiClient.get<Submission[]>(`/assignments/${assignmentId}/submissions`);
  return response.data;
}

export async function fetchAssignmentStudents(assignmentId: number) {
  const response = await apiClient.get<AssignmentStudentSubmission[]>(
    `/assignments/${assignmentId}/students`
  );
  return response.data;
}

export async function fetchSubmissions() {
  const response = await apiClient.get<Submission[]>("/submissions");
  return response.data;
}

export async function gradeSubmission(submissionId: number, payload: GradePayload) {
  const response = await apiClient.put<Submission>(`/submissions/${submissionId}/grade`, payload);
  return response.data;
}
