import { apiClient } from "./client";
import type { CourseModule, Lesson, LessonPayload, ModulePayload } from "../types/content";

export async function fetchModules(courseId: string | number) {
  const response = await apiClient.get<CourseModule[]>(`/courses/${courseId}/modules`);
  return response.data;
}

export async function createModule(courseId: string | number, payload: ModulePayload) {
  const response = await apiClient.post<CourseModule>(`/courses/${courseId}/modules`, payload);
  return response.data;
}

export async function updateModule(moduleId: number, payload: Partial<ModulePayload>) {
  const response = await apiClient.put<CourseModule>(`/modules/${moduleId}`, payload);
  return response.data;
}

export async function deleteModule(moduleId: number) {
  await apiClient.delete(`/modules/${moduleId}`);
}

export async function fetchLessons(moduleId: number) {
  const response = await apiClient.get<Lesson[]>(`/modules/${moduleId}/lessons`);
  return response.data;
}

export async function createLesson(moduleId: number, payload: LessonPayload) {
  const response = await apiClient.post<Lesson>(`/modules/${moduleId}/lessons`, payload);
  return response.data;
}

export async function updateLesson(lessonId: number, payload: Partial<LessonPayload>) {
  const response = await apiClient.put<Lesson>(`/lessons/${lessonId}`, payload);
  return response.data;
}

export async function deleteLesson(lessonId: number) {
  await apiClient.delete(`/lessons/${lessonId}`);
}

export async function completeLesson(lessonId: number) {
  await apiClient.post(`/lessons/${lessonId}/complete`);
}

export async function fetchCourseContent(courseId: string | number) {
  const modules = await fetchModules(courseId);
  const lessonsByModule = await Promise.all(
    modules.map(async (module) => ({
      moduleId: module.id,
      lessons: await fetchLessons(module.id)
    }))
  );

  const lessonMap = new Map(lessonsByModule.map((item) => [item.moduleId, item.lessons]));
  return modules.map((module) => ({
    ...module,
    lessons: lessonMap.get(module.id) ?? []
  }));
}
