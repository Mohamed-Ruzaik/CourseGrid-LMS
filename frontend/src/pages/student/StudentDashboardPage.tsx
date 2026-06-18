import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, ClipboardList, Code2, PlayCircle, Star } from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { fetchCourseContent } from "../../api/content";
import { fetchCourses } from "../../api/courses";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import type { ModuleWithLessons } from "../../types/content";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type ContinueTarget = {
  course: Course;
  module: ModuleWithLessons | null;
};

function findActiveModule(modules: ModuleWithLessons[]) {
  return (
    modules.find((module) => module.lessons.some((lesson) => !lesson.is_completed)) ??
    modules[0] ??
    null
  );
}

export function StudentDashboardPage() {
  const { user, refreshCurrentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [continueTarget, setContinueTarget] = useState<ContinueTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [, courseData, summaryData] = await Promise.all([
        refreshCurrentUser(),
        fetchCourses({ enrolled: true }),
        fetchAnalyticsSummary()
      ]);
      setCourses(courseData);
      setSummary(summaryData);

      const contentGroups = await Promise.all(
        courseData.map(async (course) => ({
          course,
          modules: await fetchCourseContent(course.id)
        }))
      );
      const activeCourse =
        contentGroups.find((group) =>
          group.modules.some((module) => module.lessons.some((lesson) => !lesson.is_completed))
        ) ?? contentGroups[0];
      setContinueTarget(
        activeCourse
          ? { course: activeCourse.course, module: findActiveModule(activeCourse.modules) }
          : null
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load student dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, [refreshCurrentUser]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="mx-auto max-w-[1280px]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {user?.name?.trim() || "Student"}!
          </h1>
          <p className="mt-2 text-base text-slate-600">Let's continue your learning journey.</p>
        </div>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={BookOpen} tone="blue" label="Enrolled Courses" value={summary?.total_courses ?? 0} to="/student/courses" />
          <DashboardStat icon={CheckCircle2} tone="green" label="Completed Lessons" value={summary?.completed_lessons ?? 0} to="/student/courses" />
          <DashboardStat icon={ClipboardList} tone="amber" label="Pending Assignments" value={summary?.pending_assignments ?? 0} to="/student/assignments" />
          <DashboardStat icon={Star} tone="purple" label="Graded Submissions" value={summary?.total_graded_submissions ?? 0} to="/student/grades" />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Continue learning</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {continueTarget?.course.title ?? "No active course yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {continueTarget?.module
                  ? `Last active module: Module ${continueTarget.module.position} - ${continueTarget.module.title}`
                  : isLoading
                    ? "Finding your latest course progress..."
                    : "Enroll in a course to start learning."}
              </p>
            </div>
            {continueTarget ? (
              <Link
                to={`/student/courses/${continueTarget.course.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Resume course
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-xl font-bold text-slate-950">My Courses</h2>
            <Link to="/student/courses" className="text-sm font-bold text-blue-600">
              View all courses
            </Link>
          </div>

          {isLoading ? (
            <p className="px-6 pb-6 text-sm text-slate-600">Loading enrolled courses...</p>
          ) : courses.length === 0 ? (
            <div className="px-6 pb-6">
              <p className="text-sm text-slate-600">You are not enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <Link
                  key={course.id}
                  to={`/student/courses/${course.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600">
                    <Code2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-950">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {course.description || "No description provided."}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

type StatTone = "blue" | "green" | "amber" | "purple";

function DashboardStat({
  icon: Icon,
  label,
  to,
  tone,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  to: string;
  tone: StatTone;
  value: string | number;
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <Link to={to} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Link>
  );
}
