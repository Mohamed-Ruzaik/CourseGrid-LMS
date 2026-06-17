import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAnnouncements } from "../../api/announcements";
import { completeLesson, fetchCourseContent } from "../../api/content";
import { fetchCourse } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Announcement } from "../../types/announcement";
import type { Lesson, ModuleWithLessons } from "../../types/content";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function StudentCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourse = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [courseData, contentData, announcementData] = await Promise.all([
        fetchCourse(id),
        fetchCourseContent(id),
        fetchAnnouncements(id)
      ]);
      setCourse(courseData);
      setModules(contentData);
      setAnnouncements(announcementData);
      setSelectedLesson((currentLesson) => {
        if (!currentLesson) {
          return contentData[0]?.lessons[0] ?? null;
        }
        return (
          contentData.flatMap((module) => module.lessons).find((lesson) => lesson.id === currentLesson.id) ??
          contentData[0]?.lessons[0] ??
          null
        );
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load enrolled course."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  async function handleCompleteLesson(lesson: Lesson) {
    setCompletingId(lesson.id);
    setError("");
    setSuccess("");
    try {
      await completeLesson(lesson.id);
      setSuccess(`Completed ${lesson.title}.`);
      await loadCourse();
    } catch (completeError) {
      setError(getApiErrorMessage(completeError, "Could not mark lesson complete."));
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={course?.title ?? "Student Course Detail"}
        description="Enrolled course overview with lessons and instructor announcements."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading course...</MessageBox> : null}
        {course ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{course.title}</h2>
              <CourseStatusBadge status={course.status} />
              <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                enrolled
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {course.description || "No description provided."}
            </p>
          </section>
        ) : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Announcements
            </h2>
          </div>
          {isLoading ? null : announcements.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No announcements have been posted yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="p-5">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-base font-semibold text-slate-950">{announcement.title}</h3>
                    <p className="text-xs text-slate-500">{formatDate(announcement.created_at)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {announcement.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
        {!isLoading && modules.length === 0 ? (
          <MessageBox>No modules have been published for this course yet.</MessageBox>
        ) : null}
        {modules.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <section className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Module {module.position}
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-950">{module.title}</h3>
                  <div className="mt-3 space-y-2">
                    {module.lessons.length === 0 ? (
                      <p className="text-sm text-slate-600">No lessons yet.</p>
                    ) : (
                      module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setSelectedLesson(lesson)}
                          className={[
                            "w-full rounded-md border px-3 py-2 text-left text-sm",
                            selectedLesson?.id === lesson.id
                              ? "border-brand-200 bg-brand-50 text-brand-700"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          ].join(" ")}
                        >
                          <span className="font-semibold">{lesson.position}. {lesson.title}</span>
                          <span className="mt-1 block text-xs">
                            {lesson.is_completed ? "Completed" : "Not completed"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {selectedLesson ? (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Lesson {selectedLesson.position}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950">
                        {selectedLesson.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCompleteLesson(selectedLesson)}
                      disabled={selectedLesson.is_completed || completingId === selectedLesson.id}
                      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {selectedLesson.is_completed
                        ? "Completed"
                        : completingId === selectedLesson.id
                          ? "Completing..."
                          : "Mark complete"}
                    </button>
                  </div>
                  <div className="mt-5 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {selectedLesson.content || "No lesson content provided."}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600">Select a lesson to view its content.</p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
