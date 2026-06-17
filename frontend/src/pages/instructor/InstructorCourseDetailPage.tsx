import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createAnnouncement, fetchAnnouncements } from "../../api/announcements";
import { fetchCourse } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Announcement } from "../../types/announcement";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function InstructorCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourse = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [courseData, announcementData] = await Promise.all([
        fetchCourse(id),
        fetchAnnouncements(id)
      ]);
      setCourse(courseData);
      setAnnouncements(announcementData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load course."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) {
      return;
    }

    setIsPosting(true);
    setError("");
    setSuccess("");
    try {
      await createAnnouncement(id, {
        title: announcementTitle,
        message: announcementMessage
      });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setSuccess("Announcement posted.");
      await loadCourse();
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Could not post announcement."));
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={course?.title ?? "Instructor Course Detail"}
        description="Course overview, builder access, and announcements for enrolled students."
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
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {course.description || "No description provided."}
            </p>
            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">Course ID</dt>
                <dd className="mt-1 text-slate-950">{course.id}</dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">Instructor ID</dt>
                <dd className="mt-1 text-slate-950">{course.instructor_id}</dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">Next phase</dt>
                <dd className="mt-1 text-slate-950">Assignments and announcements</dd>
              </div>
            </dl>
            <div className="mt-5">
              <Link
                to={`/instructor/courses/${course.id}/builder`}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Open builder
              </Link>
            </div>
          </section>
        ) : null}
        {course ? (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                New announcement
              </h2>
            </div>
            <form className="space-y-4 p-5" onSubmit={(event) => void handleCreateAnnouncement(event)}>
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  value={announcementTitle}
                  onChange={(event) => setAnnouncementTitle(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  value={announcementMessage}
                  onChange={(event) => setAnnouncementMessage(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isPosting}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPosting ? "Posting..." : "Post announcement"}
              </button>
            </form>
          </section>
        ) : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Announcements
            </h2>
          </div>
          {isLoading ? null : announcements.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No announcements posted yet.</p>
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
      </div>
    </>
  );
}
