import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, PenLine, TrendingUp } from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorDashboardPage() {
  const { user, refreshCurrentUser } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [, summaryData] = await Promise.all([
        refreshCurrentUser(),
        fetchAnalyticsSummary()
      ]);
      setSummary(summaryData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load instructor summary."));
    } finally {
      setIsLoading(false);
    }
  }, [refreshCurrentUser]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const ungradedCount = summary
    ? Math.max(summary.total_submissions - summary.total_graded_submissions, 0)
    : 0;

  return (
    <div className="mx-auto max-w-[1280px]">
      <section className="space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {user?.name?.trim() || "Instructor"}!
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
          <h2 className="text-xl font-bold text-slate-950">Instructor Actions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ActionRow icon={PenLine} title="Review new submissions" note={`${ungradedCount} submissions need feedback`} to="/instructor/submissions" />
            <ActionRow icon={ClipboardList} title="Create assignment" note="Add a new text-based course task" to="/instructor/assignments" />
          </div>
        </section>
      </section>
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

function ActionRow({ icon: Icon, note, title, to }: { icon: ComponentType<{ className?: string }>; note: string; title: string; to: string }) {
  return (
    <Link to={to} className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50">
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
