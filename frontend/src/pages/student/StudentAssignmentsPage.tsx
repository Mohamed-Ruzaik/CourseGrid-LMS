import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Lock, Send } from "lucide-react";
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

function isPastDue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function isActionable(assignment: AssignmentRow) {
  return assignment.grade === null && !isPastDue(assignment.due_date) && assignment.attempt_count < 3;
}

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const actionableAssignments = useMemo(
    () =>
      assignments
        .filter(isActionable)
        .sort((first, second) => (first.due_date ?? "").localeCompare(second.due_date ?? "")),
    [assignments]
  );

  const selectedAssignment = useMemo(
    () =>
      actionableAssignments.find((assignment) => assignment.id === selectedAssignmentId) ??
      actionableAssignments[0] ??
      null,
    [actionableAssignments, selectedAssignmentId]
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
      const rows = groups.flat();
      setAssignments(rows);
      setSelectedAssignmentId((current) => {
        if (current && rows.some((assignment) => assignment.id === current && isActionable(assignment))) {
          return current;
        }
        return rows.find(isActionable)?.id ?? null;
      });
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
        title="Assignments"
        description="Only active assignments that still need action are listed here."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading assignments...</MessageBox>
        ) : actionableAssignments.length === 0 ? (
          <MessageBox>No active assignments to submit right now.</MessageBox>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <section className="space-y-3">
              {actionableAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                  className={[
                    "w-full rounded-xl border p-4 text-left shadow-sm transition",
                    selectedAssignment?.id === assignment.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {assignment.courseTitle}
                      </p>
                      <h2 className="mt-1 font-bold text-slate-950">{assignment.title}</h2>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      {assignment.submitted ? "Resubmit" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Due {formatDate(assignment.due_date)} - Attempts {assignment.attempt_count}/3
                  </p>
                </button>
              ))}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {selectedAssignment ? (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {selectedAssignment.courseTitle}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-950">{selectedAssignment.title}</h2>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {selectedAssignment.description || "No instructions provided."}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="font-bold text-slate-950">{selectedAssignment.max_points} points</p>
                      <p>Due {formatDate(selectedAssignment.due_date)}</p>
                      <p>{3 - selectedAssignment.attempt_count} attempts left</p>
                    </div>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event, selectedAssignment)}>
                    <label className="block text-sm font-bold text-slate-700">
                      Submission text
                      <textarea
                        value={submissionText[selectedAssignment.id] ?? ""}
                        onChange={(event) =>
                          setSubmissionText((current) => ({
                            ...current,
                            [selectedAssignment.id]: event.target.value
                          }))
                        }
                        rows={8}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={submittingId === selectedAssignment.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      {submittingId === selectedAssignment.id
                        ? "Submitting..."
                        : selectedAssignment.submitted
                          ? "Resubmit assignment"
                          : "Submit assignment"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div>
                    <ClipboardList className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                    <p className="mt-3 text-sm text-slate-600">Select an assignment to open it.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {!isLoading && assignments.some((assignment) => isPastDue(assignment.due_date) || assignment.attempt_count >= 3) ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Locked assignments are hidden from the action list.
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Overdue assignments or assignments with 3 submitted attempts cannot be submitted again.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
