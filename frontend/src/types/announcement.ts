export type Announcement = {
  id: number;
  course_id: number;
  author_id: number;
  title: string;
  message: string;
  created_at: string;
};

export type AnnouncementPayload = {
  title: string;
  message: string;
};
