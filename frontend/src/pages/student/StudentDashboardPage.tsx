import { useCallback, useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { Link } from "react-router-dom";
import { fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import type { AnalyticsSummary } from "../../types/analytics";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function StudentDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEnrolledCourses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [courseData, summaryData] = await Promise.all([
        fetchCourses({ enrolled: true }),
        fetchAnalyticsSummary()
      ]);
      setCourses(courseData);
      setSummary(summaryData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load student dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  return (
    <>
      <PageHeader
        title="Student Dashboard"
        description="Your enrolled courses and learning summary."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Enrolled courses" value={summary.total_courses} />
            <StatCard label="Pending assignments" value={summary.pending_assignments} />
            <StatCard label="Completed lessons" value={summary.completed_lessons} />
            <StatCard
              label="Graded submissions"
              value={summary.total_graded_submissions}
              helper={
                summary.average_grade === null
                  ? "No grades yet"
                  : `Average grade ${summary.average_grade}`
              }
            />
          </div>
        ) : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Enrolled courses
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading enrolled courses...</p>
          ) : courses.length === 0 ? (
            <div className="p-5">
              <p className="text-sm text-slate-600">You are not enrolled in any courses yet.</p>
              <Link
                to="/student/courses"
                className="mt-4 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {courses.map((course) => (
                <article key={course.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-950">{course.title}</h3>
                      <CourseStatusBadge status={course.status} />
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">{course.description}</p>
                  </div>
                  <Link
                    to={`/student/courses/${course.id}`}
                    className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Continue
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
