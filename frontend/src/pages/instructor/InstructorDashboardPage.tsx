import { useCallback, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, GraduationCap, MessageSquare, PenLine, TrendingUp } from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setSummary(await fetchAnalyticsSummary());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load instructor summary."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const ungradedCount = summary
    ? Math.max(summary.total_submissions - summary.total_graded_submissions, 0)
    : 0;

  return (
    <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_320px]">
      <section className="space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {user?.name?.split(" ")[0] ?? "Instructor"}!
          </h1>
          <p className="mt-2 text-lg text-slate-600">Review your teaching workspace and grading queue.</p>
        </div>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading instructor summary...</MessageBox> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={BookOpen} tone="blue" label="My Courses" value={summary?.total_courses ?? 0} to="/instructor/courses" action="Manage courses" />
          <DashboardStat icon={ClipboardList} tone="amber" label="Assignments" value={summary?.total_assignments ?? 0} to="/instructor/assignments" action="View assignments" />
          <DashboardStat icon={PenLine} tone="purple" label="Pending Grading" value={ungradedCount} to="/instructor/submissions" action="Grade work" />
          <DashboardStat icon={TrendingUp} tone="green" label="Enrollments" value={summary?.total_enrollments ?? 0} to="/instructor/courses" action="View activity" />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-xl font-bold text-slate-950">Teaching Overview</h2>
            <Link to="/instructor/courses" className="text-sm font-bold text-blue-600">
              View all courses
            </Link>
          </div>
          <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">
            <OverviewCard title="Submissions" value={summary?.total_submissions ?? 0} note="Total student work received" />
            <OverviewCard title="Graded Work" value={summary?.total_graded_submissions ?? 0} note="Submissions with feedback" />
            <OverviewCard title="Average Grade" value={summary?.average_grade ?? "N/A"} note="Across graded submissions" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Priority Actions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ActionRow icon={PenLine} title="Review new submissions" note={`${ungradedCount} submissions need feedback`} to="/instructor/submissions" />
            <ActionRow icon={ClipboardList} title="Create assignment" note="Add a new text-based course task" to="/instructor/assignments" />
          </div>
        </section>
      </section>

      <aside className="space-y-5">
        <SidePanel title="Recent Teaching Notes">
          <ActionRow icon={MessageSquare} title="Feedback reminder" note="Keep feedback short, specific, and actionable." to="/instructor/submissions" compact />
          <ActionRow icon={GraduationCap} title="Course builder" note="Add modules and lessons for your active courses." to="/instructor/courses" compact />
        </SidePanel>
        <SidePanel title="Course Health">
          <div className="space-y-4">
            <HealthRow label="Content coverage" value="82%" />
            <HealthRow label="Grading progress" value={`${summary?.total_submissions ? Math.round(((summary.total_graded_submissions ?? 0) / summary.total_submissions) * 100) : 0}%`} />
            <HealthRow label="Enrollment activity" value={String(summary?.total_enrollments ?? 0)} />
          </div>
        </SidePanel>
      </aside>
    </div>
  );
}

type StatTone = "blue" | "green" | "amber" | "purple";

function DashboardStat({ action, icon: Icon, label, to, tone, value }: { action: string; icon: ComponentType<{ className?: string }>; label: string; to: string; tone: StatTone; value: string | number }) {
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
      <Link to={to} className="mt-7 inline-block text-sm font-bold text-blue-600">{action}</Link>
    </article>
  );
}

function OverviewCard({ note, title, value }: { note: string; title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function SidePanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-slate-950">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ActionRow({ compact = false, icon: Icon, note, title, to }: { compact?: boolean; icon: ComponentType<{ className?: string }>; note: string; title: string; to: string }) {
  return (
    <Link to={to} className={`flex gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50 ${compact ? "" : "bg-white"}`}>
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{note}</p>
      </div>
    </Link>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
