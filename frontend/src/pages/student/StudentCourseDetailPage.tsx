import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, CheckCircle2, ClipboardList, FileText, Lock } from "lucide-react";
import { fetchAnnouncements } from "../../api/announcements";
import { fetchCourseAssignments } from "../../api/assignments";
import { completeLesson, fetchCourseContent } from "../../api/content";
import { fetchCourse } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Announcement } from "../../types/announcement";
import type { Assignment } from "../../types/assignment";
import type { Lesson, ModuleWithLessons } from "../../types/content";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

const SLIDE_PREFIX = "[Lecture Slide]";

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function isPastDue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function getModulePrefix(module: ModuleWithLessons) {
  return `Module ${module.position}: ${module.title}`;
}

function stripSlidePrefix(title: string) {
  return title.startsWith(SLIDE_PREFIX) ? title.slice(SLIDE_PREFIX.length).trim() : title;
}

function stripModulePrefix(description: string) {
  const separator = "\n\n";
  return description.includes(separator) ? description.split(separator).slice(1).join(separator) : description;
}

function assignmentBelongsToModule(assignment: Assignment, module: ModuleWithLessons) {
  return assignment.description.startsWith(getModulePrefix(module));
}

function assignmentIsUnscoped(assignment: Assignment) {
  return !assignment.description.startsWith("Module ");
}

export function StudentCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) ?? modules[0] ?? null,
    [activeModuleId, modules]
  );

  const activeSlides = useMemo(
    () => {
      const lessons = activeModule?.lessons ?? [];
      const prefixedSlides = lessons.filter((lesson) => lesson.title.startsWith(SLIDE_PREFIX));
      return prefixedSlides.length > 0 ? prefixedSlides : lessons;
    },
    [activeModule]
  );

  const activeAssignments = useMemo(
    () => {
      if (!activeModule) {
        return [];
      }

      return assignments.filter(
        (assignment) =>
          assignmentBelongsToModule(assignment, activeModule) ||
          (modules[0]?.id === activeModule.id && assignmentIsUnscoped(assignment))
      );
    },
    [activeModule, assignments, modules]
  );

  const loadCourse = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [courseData, contentData, assignmentData, announcementData] = await Promise.all([
        fetchCourse(id),
        fetchCourseContent(id),
        fetchCourseAssignments(id),
        fetchAnnouncements(id)
      ]);
      setCourse(courseData);
      setModules(contentData);
      setAssignments(assignmentData);
      setAnnouncements(announcementData);
      setActiveModuleId((current) => current ?? contentData[0]?.id ?? null);
      setSelectedSlide((current) => {
        const prefixedSlides = contentData.flatMap((module) =>
          module.lessons.filter((lesson) => lesson.title.startsWith(SLIDE_PREFIX))
        );
        const slides = prefixedSlides.length > 0 ? prefixedSlides : contentData.flatMap((module) => module.lessons);
        return slides.find((lesson) => lesson.id === current?.id) ?? slides[0] ?? null;
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

  async function handleCompleteSlide(lesson: Lesson) {
    setCompletingId(lesson.id);
    setError("");
    setSuccess("");
    try {
      await completeLesson(lesson.id);
      setSuccess(`Completed ${stripSlidePrefix(lesson.title)}.`);
      await loadCourse();
    } catch (completeError) {
      setError(getApiErrorMessage(completeError, "Could not mark slide complete."));
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={course?.title ?? "Course Detail"}
        description="Open modules to view lecture slides and assignments."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading course...</MessageBox> : null}

        {course ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-950">{course.title}</h2>
              <CourseStatusBadge status={course.status} />
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                registered
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              {course.description || "No description provided."}
            </p>
          </section>
        ) : null}

        {!isLoading && modules.length === 0 ? (
          <MessageBox>No modules have been published for this course yet.</MessageBox>
        ) : null}

        {modules.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <section className="space-y-3">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setActiveModuleId(module.id);
                    setSelectedSlide(
                      module.lessons.find((lesson) => lesson.title.startsWith(SLIDE_PREFIX)) ??
                        module.lessons[0] ??
                        null
                    );
                  }}
                  className={[
                    "w-full rounded-xl border p-4 text-left shadow-sm transition",
                    activeModule?.id === module.id
                      ? "border-blue-200 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-900 hover:border-blue-200"
                  ].join(" ")}
                >
                  <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                    Module {module.position}
                  </span>
                  <span className="mt-1 block font-bold">{module.title}</span>
                  <span className="mt-3 block text-xs text-slate-500">
                    {module.lessons.length} slides
                  </span>
                </button>
              ))}
            </section>

            <section className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lecture slides</p>
                    <h2 className="font-bold text-slate-950">{activeModule?.title ?? "Module"}</h2>
                  </div>
                </div>

                {activeSlides.length === 0 ? (
                  <p className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No lecture slides added for this module.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-3 lg:grid-cols-[260px_1fr]">
                    <div className="space-y-2">
                      {activeSlides.map((slide) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setSelectedSlide(slide)}
                          className={[
                            "w-full rounded-lg border px-3 py-3 text-left text-sm transition",
                            selectedSlide?.id === slide.id
                              ? "border-blue-200 bg-blue-50 text-blue-900"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          ].join(" ")}
                        >
                          <span className="font-bold">{stripSlidePrefix(slide.title)}</span>
                          <span className="mt-1 flex items-center gap-1 text-xs">
                            {slide.is_completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            {slide.is_completed ? "Completed" : "Not completed"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      {selectedSlide ? (
                        <>
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Slide {selectedSlide.position}
                              </p>
                              <h3 className="mt-1 font-bold text-slate-950">{stripSlidePrefix(selectedSlide.title)}</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleCompleteSlide(selectedSlide)}
                              disabled={selectedSlide.is_completed || completingId === selectedSlide.id}
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {selectedSlide.is_completed
                                ? "Completed"
                                : completingId === selectedSlide.id
                                  ? "Completing..."
                                  : "Mark complete"}
                            </button>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {selectedSlide.content || "No slide content provided."}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-600">Select a slide to view content.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignments</p>
                    <h2 className="font-bold text-slate-950">{activeModule?.title ?? "Module"}</h2>
                  </div>
                </div>

                {activeAssignments.length === 0 ? (
                  <p className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No assignments added for this module.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {activeAssignments.map((assignment) => {
                      const locked = isPastDue(assignment.due_date) || assignment.attempt_count >= 3;
                      return (
                        <article key={assignment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                <h3 className="font-bold text-slate-950">{assignment.title}</h3>
                                {locked ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700">
                                    <Lock className="h-3 w-3" aria-hidden="true" />
                                    Locked
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {stripModulePrefix(assignment.description) || "No instructions provided."}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                Due {formatDate(assignment.due_date)} - {assignment.max_points} points - Attempts {assignment.attempt_count}/3
                              </p>
                              {isPastDue(assignment.due_date) ? (
                                <p className="mt-2 text-sm font-bold text-red-600">Due time has passed.</p>
                              ) : null}
                            </div>
                            {locked ? (
                              <span className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
                                Submission locked
                              </span>
                            ) : (
                              <Link
                                to="/student/assignments"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-blue-700"
                              >
                                Open assignment
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No announcements have been posted yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="p-5">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <h3 className="font-bold text-slate-950">{announcement.title}</h3>
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
