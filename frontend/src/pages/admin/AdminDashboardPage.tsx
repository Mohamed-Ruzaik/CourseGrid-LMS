import { useCallback, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, Database, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { fetchAnalyticsSummary } from "../../api/analytics";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { AnalyticsSummary } from "../../types/analytics";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function AdminDashboardPage() {
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
      setError(getApiErrorMessage(loadError, "Could not load analytics summary."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_320px]">
      <section className="space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Good morning, {user?.name?.split(" ")[0] ?? "Admin"}!
          </h1>
          <p className="mt-2 text-lg text-slate-600">Monitor CourseGrid platform activity.</p>
        </div>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading analytics summary...</MessageBox> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat icon={UsersRound} tone="blue" label="Total Users" value={summary?.total_users ?? 0} to="/admin/users" action="Manage users" />
          <DashboardStat icon={BookOpen} tone="green" label="Courses" value={summary?.total_courses ?? 0} to="/admin/courses" action="View courses" />
          <DashboardStat icon={GraduationCap} tone="amber" label="Enrollments" value={summary?.total_enrollments ?? 0} to="/admin/courses" action="View activity" />
          <DashboardStat icon={ClipboardList} tone="purple" label="Assignments" value={summary?.total_assignments ?? 0} to="/admin/courses" action="Review LMS" />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-xl font-bold text-slate-950">Platform Summary</h2>
            <Link to="/admin/courses" className="text-sm font-bold text-blue-600">
              Manage courses
            </Link>
          </div>
          <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">
            <OverviewCard title="Submissions" value={summary?.total_submissions ?? 0} note="Total assignment submissions" />
            <OverviewCard title="Graded Submissions" value={summary?.total_graded_submissions ?? 0} note="Submissions with instructor feedback" />
            <OverviewCard title="Average Grade" value={summary?.average_grade ?? "N/A"} note="Across recorded grades" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Admin Workbench</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ActionRow icon={UsersRound} title="User management" note="Review admin, instructor, and student accounts." to="/admin/users" />
            <ActionRow icon={BookOpen} title="Course management" note="Create, edit, publish, or archive courses." to="/admin/courses" />
          </div>
        </section>
      </section>

      <aside className="space-y-5">
        <SidePanel title="System Snapshot">
          <HealthRow label="API readiness" value="Healthy" />
          <HealthRow label="Database" value="PostgreSQL" />
          <HealthRow label="Deployment mode" value="Docker" />
        </SidePanel>
        <SidePanel title="DevOps Highlights">
          <ActionRow icon={ShieldCheck} title="Role-based access" note="Admin, instructor, and student routes are protected." to="/admin/users" compact />
          <ActionRow icon={Database} title="Seeded data model" note="Courses, modules, lessons, assignments, and submissions are represented." to="/admin/courses" compact />
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
