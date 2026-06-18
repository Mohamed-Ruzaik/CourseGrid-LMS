import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Code2,
  Star,
  CheckCircle2
} from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { fetchCourses } from "../../api/courses";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function StudentDashboardPage() {
  const { user } = useAuth();
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
    <div className="mx-auto max-w-[1280px]">
      <section className="space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {user?.name?.split(" ")[0] ?? "Student"}!
          </h1>
          <p className="mt-2 text-lg text-slate-600">Let's continue your learning journey.</p>
        </div>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            icon={BookOpen}
            tone="blue"
            label="Enrolled Courses"
            value={summary?.total_courses ?? 0}
            action="View all"
            to="/student/courses"
          />
          <DashboardStat
            icon={CheckCircle2}
            tone="green"
            label="Completed Lessons"
            value={summary?.completed_lessons ?? 0}
            action="View courses"
            to="/student/courses"
          />
          <DashboardStat
            icon={ClipboardList}
            tone="amber"
            label="Pending Assignments"
            value={summary?.pending_assignments ?? 0}
            action="View assignments"
            to="/student/assignments"
          />
          <DashboardStat
            icon={Star}
            tone="purple"
            label="Graded Submissions"
            value={summary?.total_graded_submissions ?? 0}
            action="View grades"
            to="/student/grades"
          />
        </div>

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
              <Link
                to="/student/courses"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 px-4 pb-2">
              {courses.slice(0, 4).map((course) => (
                  <article
                    key={course.id}
                    className="grid gap-4 px-2 py-5 md:grid-cols-[76px_1fr_120px] md:items-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Code2 className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{course.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{course.description}</p>
                    </div>
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-600 hover:bg-blue-100"
                    >
                      Continue
                    </Link>
                  </article>
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
  action,
  icon: Icon,
  label,
  to,
  tone,
  value
}: {
  action: string;
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
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`grid h-14 w-14 place-items-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-7 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-slate-600">{label}</p>
      <Link to={to} className="mt-7 inline-block text-sm font-bold text-blue-600">
        {action}
      </Link>
    </article>
  );
}
