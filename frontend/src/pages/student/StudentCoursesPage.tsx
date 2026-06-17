import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { enrollInCourse, fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      <PageHeader
        title="Student Courses"
        description="Browse published courses and enroll in the ones you want to take."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading courses...</MessageBox>
        ) : courses.length === 0 ? (
          <MessageBox>No published courses are available yet.</MessageBox>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <article key={course.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-950">{course.title}</h2>
                      <CourseStatusBadge status={course.status} />
                      {course.is_enrolled ? (
                        <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          enrolled
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {course.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.is_enrolled ? (
                      <Link
                        to={`/student/courses/${course.id}`}
                        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        View course
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleEnroll(course)}
                        disabled={enrollingId === course.id}
                        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
