import { apiClient } from "./client";
import type { Announcement, AnnouncementPayload } from "../types/announcement";

export async function fetchAnnouncements(courseId: string | number) {
  const response = await apiClient.get<Announcement[]>(`/courses/${courseId}/announcements`);
  return response.data;
}

export async function createAnnouncement(courseId: string | number, payload: AnnouncementPayload) {
  const response = await apiClient.post<Announcement>(
    `/courses/${courseId}/announcements`,
    payload
  );
  return response.data;
}
