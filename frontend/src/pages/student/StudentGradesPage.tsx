import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCourseAssignments, fetchSubmissions } from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment, Submission } from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type GradeRow = Submission & {
  assignmentTitle: string;
  courseTitle: string;
  maxPoints: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not graded";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function StudentGradesPage() {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const gradedRows = useMemo(
    () => rows.filter((row) => row.grade !== null).sort((first, second) => second.submitted_at.localeCompare(first.submitted_at)),
    [rows]
  );

  const loadGrades = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [submissions, enrolledCourses] = await Promise.all([
        fetchSubmissions(),
        fetchCourses({ enrolled: true })
      ]);
      const assignmentMeta = new Map<number, { assignment: Assignment; course: Course }>();

      await Promise.all(
        enrolledCourses.map(async (course: Course) => {
          const assignments = await fetchCourseAssignments(course.id);
          assignments.forEach((assignment) => {
            assignmentMeta.set(assignment.id, { assignment, course });
          });
        })
      );

      setRows(
        submissions.map((submission) => {
          const meta = assignmentMeta.get(submission.assignment_id);
          return {
            ...submission,
            assignmentTitle: meta?.assignment.title ?? `Assignment #${submission.assignment_id}`,
            courseTitle: meta?.course.title ?? "Course",
            maxPoints: meta?.assignment.max_points ?? 100
          };
        })
      );
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
      <PageHeader
        title="Student Grades"
        description="Review graded assignment submissions and instructor feedback."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Graded submissions
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading grades...</p>
          ) : gradedRows.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No graded submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Assignment</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Grade</th>
                    <th className="px-5 py-3">Feedback</th>
                    <th className="px-5 py-3">Graded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {gradedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-4 font-semibold text-slate-950">{row.assignmentTitle}</td>
                      <td className="px-5 py-4">{row.courseTitle}</td>
                      <td className="px-5 py-4">
                        {row.grade} / {row.maxPoints}
                      </td>
                      <td className="max-w-md px-5 py-4 text-slate-600">
                        {row.feedback || "No feedback provided."}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(row.graded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
