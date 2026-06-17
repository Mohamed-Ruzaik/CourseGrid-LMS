import { useCallback, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Megaphone,
  PlayCircle,
  Star,
  TrendingUp
} from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { fetchCourses } from "../../api/courses";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

function progressFor(index: number) {
  return [75, 40, 20, 55][index % 4];
}

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

  const averageGrade = summary?.average_grade === null ? "B+" : summary?.average_grade ?? "B+";

  return (
    <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_320px]">
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
            icon={TrendingUp}
            tone="green"
            label="Average Progress"
            value={`${summary?.completed_lessons ? 65 : 0}%`}
            action="View progress"
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
            label="Average Grade"
            value={averageGrade}
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
              {courses.slice(0, 4).map((course, index) => {
                const progress = progressFor(index);
                return (
                  <article
                    key={course.id}
                    className="grid gap-4 px-2 py-5 md:grid-cols-[76px_1fr_260px_100px] md:items-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Code2 className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{course.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">Instructor: CourseGrid Faculty</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-10 text-sm font-bold text-slate-950">{progress}%</span>
                    </div>
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-600 hover:bg-blue-100"
                    >
                      Continue
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Continue Learning</h2>
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <PlayCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">HTML Basics</h3>
                <p className="mt-1 text-sm text-slate-500">Web Development Fundamentals • Module 1</p>
              </div>
            </div>
            <Link
              to={courses[0] ? `/student/courses/${courses[0].id}` : "/student/courses"}
              className="rounded-lg bg-blue-50 px-6 py-3 text-center text-sm font-bold text-blue-600"
            >
              Resume
            </Link>
          </div>
        </section>
      </section>

      <aside className="space-y-5">
        <SidePanel title="Upcoming Deadlines">
          <Deadline title="Assignment 2" course="Web Development Fundamentals" due="Due in 2 days" tone="rose" />
          <Deadline title="Quiz 1" course="Database Systems" due="Due in 5 days" tone="amber" />
          <Deadline title="Lab Report" course="Cloud Computing Basics" due="Due in 7 days" tone="green" />
          <Link to="/student/assignments" className="inline-block pt-2 text-sm font-bold text-blue-600">
            View all
          </Link>
        </SidePanel>
        <SidePanel title="Recent Announcements">
          <div className="flex gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <Megaphone className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950">Midterm Exam Schedule</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The midterm exam will be held on 25th May 2025.
              </p>
              <p className="mt-3 text-sm text-slate-500">2 days ago</p>
            </div>
          </div>
          <Link to="/student/courses" className="inline-block pt-4 text-sm font-bold text-blue-600">
            View all
          </Link>
        </SidePanel>
      </aside>
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

function SidePanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-slate-950">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Deadline({
  course,
  due,
  title,
  tone
}: {
  course: string;
  due: string;
  title: string;
  tone: "rose" | "amber" | "green";
}) {
  const toneClasses = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600"
  };

  return (
    <div className="flex gap-4">
      <div className={`grid h-14 w-14 place-items-center rounded-xl ${toneClasses[tone]}`}>
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{course}</p>
        <p className={`mt-2 text-sm font-semibold ${tone === "rose" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-emerald-600"}`}>
          {due}
        </p>
      </div>
    </div>
  );
}
