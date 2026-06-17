export type CourseModule = {
  id: number;
  course_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: number;
  module_id: number;
  title: string;
  content: string;
  position: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type ModulePayload = {
  title: string;
  position: number;
};

export type LessonPayload = {
  title: string;
  content: string;
  position: number;
};

export type ModuleWithLessons = CourseModule & {
  lessons: Lesson[];
};
