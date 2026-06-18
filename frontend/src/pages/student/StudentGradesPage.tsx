import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { fetchCourseAssignments } from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment } from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type CourseGradeGroup = {
  course: Course;
  assignments: Assignment[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getCourseTotals(assignments: Assignment[]) {
  const graded = assignments.filter((assignment) => assignment.grade !== null);
  if (graded.length === 0) {
    return null;
  }

  return {
    earned: graded.reduce((total, assignment) => total + (assignment.grade ?? 0), 0),
    possible: graded.reduce((total, assignment) => total + assignment.max_points, 0),
    gradedCount: graded.length
  };
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function StudentGradesPage() {
  const [groups, setGroups] = useState<CourseGradeGroup[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.course.id === selectedCourseId) ?? groups[0] ?? null,
    [groups, selectedCourseId]
  );

  const loadGrades = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const enrolledCourses = await fetchCourses({ enrolled: true });
      const courseGroups = await Promise.all(
        enrolledCourses.map(async (course) => ({
          course,
          assignments: await fetchCourseAssignments(course.id)
        }))
      );

      setGroups(courseGroups);
      setSelectedCourseId((current) => {
        if (current && courseGroups.some((group) => group.course.id === current)) {
          return current;
        }
        return courseGroups[0]?.course.id ?? null;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load grades."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrades();
  }, [loadGrades]);

  return (
    <>
      <PageHeader title="Grades" description="Review course marks." />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading grades...</MessageBox>
        ) : groups.length === 0 ? (
          <MessageBox>No enrolled courses found.</MessageBox>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <section className="space-y-3">
              {groups.map((group) => {
                const totals = getCourseTotals(group.assignments);
                return (
                  <button
                    key={group.course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(group.course.id)}
                    className={[
                      "w-full rounded-xl border p-4 text-left shadow-sm transition",
                      selectedGroup?.course.id === group.course.id
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-slate-950">{group.course.title}</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Total marks:{" "}
                          {totals
                            ? `${formatNumber(totals.earned)} / ${formatNumber(totals.possible)}`
                            : "thama na"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {group.assignments.length} assignments · {totals?.gradedCount ?? 0} graded
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {selectedGroup ? (
                <>
                  <div className="border-b border-slate-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selected course</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedGroup.course.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Total marks:{" "}
                      {getCourseTotals(selectedGroup.assignments)
                        ? `${formatNumber(getCourseTotals(selectedGroup.assignments)!.earned)} / ${formatNumber(
                            getCourseTotals(selectedGroup.assignments)!.possible
                          )}`
                        : "thama na"}
                    </p>
                  </div>

                  {selectedGroup.assignments.length === 0 ? (
                    <p className="p-5 text-sm text-slate-600">No assignments have been added to this course yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-3">Assignment</th>
                            <th className="px-5 py-3">Due date</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Marks</th>
                            <th className="px-5 py-3">Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                          {selectedGroup.assignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                  <span className="font-bold text-slate-950">{assignment.title}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-500">{formatDate(assignment.due_date)}</td>
                              <td className="px-5 py-4">
                                {assignment.grade !== null ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    Graded
                                  </span>
                                ) : assignment.submitted ? (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                    Submitted, not graded
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    Karala na
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 font-semibold text-slate-950">
                                {assignment.grade !== null
                                  ? `${formatNumber(assignment.grade)} / ${formatNumber(assignment.max_points)}`
                                  : "thama na"}
                              </td>
                              <td className="max-w-md px-5 py-4 text-slate-600">
                                {assignment.feedback || "No feedback yet."}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="p-5 text-sm text-slate-600">Select a course to view assignment marks.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
