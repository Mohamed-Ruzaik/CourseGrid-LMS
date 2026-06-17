import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { fetchCourseAssignments, submitAssignment } from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment } from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type AssignmentRow = Assignment & {
  courseTitle: string;
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

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [submissionText, setSubmissionText] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((first, second) => {
        if (first.submitted !== second.submitted) {
          return Number(first.submitted) - Number(second.submitted);
        }
        return (first.due_date ?? "").localeCompare(second.due_date ?? "");
      }),
    [assignments]
  );

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const enrolledCourses = await fetchCourses({ enrolled: true });
      const groups = await Promise.all(
        enrolledCourses.map(async (course: Course) => {
          const courseAssignments = await fetchCourseAssignments(course.id);
          return courseAssignments.map((assignment) => ({
            ...assignment,
            courseTitle: course.title
          }));
        })
      );
      setAssignments(groups.flat());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load assignments."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, assignment: AssignmentRow) {
    event.preventDefault();
    setSubmittingId(assignment.id);
    setError("");
    setSuccess("");
    try {
      await submitAssignment(assignment.id, { content: submissionText[assignment.id] ?? "" });
      setSuccess(`${assignment.title} submitted.`);
      setSubmissionText((current) => ({ ...current, [assignment.id]: "" }));
      await loadAssignments();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not submit assignment."));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Student Assignments"
        description="Submit text responses for assignments in your enrolled courses."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading assignments...</MessageBox>
        ) : sortedAssignments.length === 0 ? (
          <MessageBox>No assignments are available for your enrolled courses yet.</MessageBox>
        ) : (
          <div className="grid gap-4">
            {sortedAssignments.map((assignment) => (
              <article key={assignment.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          assignment.submitted
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {assignment.submitted ? "Submitted" : "Pending"}
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {assignment.courseTitle}
                      </p>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{assignment.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {assignment.description || "No description provided."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(assignment.due_date)} · {assignment.max_points} points
                    </p>
                    {assignment.grade !== null ? (
                      <p className="mt-3 text-sm font-semibold text-emerald-700">
                        Graded: {assignment.grade} / {assignment.max_points}
                      </p>
                    ) : null}
                  </div>
                </div>
                <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmit(event, assignment)}>
                  <label className="text-sm font-medium text-slate-700">
                    Submission text
                    <textarea
                      value={submissionText[assignment.id] ?? ""}
                      onChange={(event) =>
                        setSubmissionText((current) => ({
                          ...current,
                          [assignment.id]: event.target.value
                        }))
                      }
                      rows={4}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submittingId === assignment.id}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingId === assignment.id
                      ? "Submitting..."
                      : assignment.submitted
                        ? "Resubmit"
                        : "Submit assignment"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
