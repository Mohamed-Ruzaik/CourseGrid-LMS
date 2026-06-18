import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, PlusCircle } from "lucide-react";
import { enrollInCourse, fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const enrolledCourses = useMemo(() => courses.filter((course) => course.is_enrolled), [courses]);
  const availableCourses = useMemo(() => courses.filter((course) => !course.is_enrolled), [courses]);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setCourses(await fetchCourses());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load courses."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  async function handleEnroll(course: Course) {
    setEnrollingId(course.id);
    setError("");
    setSuccess("");
    try {
      await enrollInCourse(course.id);
      setSuccess(`Enrolled in ${course.title}.`);
      await loadCourses();
    } catch (enrollError) {
      setError(getApiErrorMessage(enrollError, "Could not enroll in this course."));
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <>
      <PageHeader title="My Courses" description="Your registered course list." />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading courses...</MessageBox>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Registered courses</h2>
              {enrolledCourses.length === 0 ? (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  You are not registered for any courses yet.
                </p>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {enrolledCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/student/courses/${course.id}`}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                    >
                      <CourseCardContent course={course} action="Open course" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Available courses</h2>
              {availableCourses.length === 0 ? (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  No new published courses are available right now.
                </p>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {availableCourses.map((course) => (
                    <article key={course.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <CourseCardContent course={course} action="Enroll to open" />
                      <button
                        type="button"
                        onClick={() => void handleEnroll(course)}
                        disabled={enrollingId === course.id}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PlusCircle className="h-4 w-4" aria-hidden="true" />
                        {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

function CourseCardContent({ course, action }: { course: Course; action: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <CourseStatusBadge status={course.status} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{course.title}</h3>
      <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
        {course.description || "No description provided."}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-600">
        {action}
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </>
  );
}
