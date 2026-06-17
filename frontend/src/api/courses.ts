import { apiClient } from "./client";
import type { Course, CoursePayload, Enrollment } from "../types/course";

export async function fetchCourses(options?: { enrolled?: boolean }) {
  const response = await apiClient.get<Course[]>("/courses", {
    params: options?.enrolled ? { enrolled: true } : undefined
  });
  return response.data;
}

export async function fetchCourse(courseId: string | number) {
  const response = await apiClient.get<Course>(`/courses/${courseId}`);
  return response.data;
}

export async function createCourse(payload: CoursePayload) {
  const response = await apiClient.post<Course>("/courses", payload);
  return response.data;
}

export async function updateCourse(courseId: number, payload: Partial<CoursePayload>) {
  const response = await apiClient.put<Course>(`/courses/${courseId}`, payload);
  return response.data;
}

export async function deleteCourse(courseId: number) {
  await apiClient.delete(`/courses/${courseId}`);
}

export async function enrollInCourse(courseId: number) {
  const response = await apiClient.post<Enrollment>(`/courses/${courseId}/enroll`);
  return response.data;
}
