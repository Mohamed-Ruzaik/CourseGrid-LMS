import type { CourseStatus } from "../types/course";

const statusClasses: Record<CourseStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600"
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {status}
    </span>
  );
}
