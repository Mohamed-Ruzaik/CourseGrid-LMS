import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAssignmentSubmissions,
  fetchCourseAssignments,
  gradeSubmission
} from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment, GradePayload, Submission } from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type SubmissionRow = Submission & {
  assignmentTitle: string;
  courseTitle: string;
  maxPoints: number;
};

type GradeFormState = {
  grade: string;
  feedback: string;
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

function statusLabel(submission: SubmissionRow) {
  if (submission.grade === null) {
    return "Pending";
  }
  return "Graded";
}

export function InstructorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [gradeForms, setGradeForms] = useState<Record<number, GradeFormState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedSubmissions = useMemo(
    () => [...submissions].sort((first, second) => Number(first.grade !== null) - Number(second.grade !== null)),
    [submissions]
  );

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const courses = await fetchCourses();
      const rows: SubmissionRow[] = [];

      await Promise.all(
        courses.map(async (course: Course) => {
          const assignments = await fetchCourseAssignments(course.id);
          await Promise.all(
            assignments.map(async (assignment: Assignment) => {
              const assignmentSubmissions = await fetchAssignmentSubmissions(assignment.id);
              rows.push(
                ...assignmentSubmissions.map((submission) => ({
                  ...submission,
                  assignmentTitle: assignment.title,
                  courseTitle: course.title,
                  maxPoints: assignment.max_points
                }))
              );
            })
          );
        })
      );

      setSubmissions(rows);
      setGradeForms(
        rows.reduce<Record<number, GradeFormState>>((forms, submission) => {
          forms[submission.id] = {
            grade: submission.grade === null ? "" : String(submission.grade),
            feedback: submission.feedback ?? ""
          };
          return forms;
        }, {})
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load submissions."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  function updateGradeForm(submissionId: number, updates: Partial<GradeFormState>) {
    setGradeForms((current) => ({
      ...current,
      [submissionId]: {
        grade: current[submissionId]?.grade ?? "",
        feedback: current[submissionId]?.feedback ?? "",
        ...updates
      }
    }));
  }

  async function handleGrade(event: FormEvent<HTMLFormElement>, submission: SubmissionRow) {
    event.preventDefault();
    const form = gradeForms[submission.id];
    const payload: GradePayload = {
      grade: Number(form?.grade ?? 0),
      feedback: form?.feedback ?? ""
    };

    setGradingId(submission.id);
    setError("");
    setSuccess("");
    try {
      await gradeSubmission(submission.id, payload);
      setSuccess("Submission graded.");
      await loadSubmissions();
    } catch (gradeError) {
      setError(getApiErrorMessage(gradeError, "Could not grade submission."));
    } finally {
      setGradingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Instructor Submissions"
        description="Review student text submissions and add simple grades with feedback."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Submission queue
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading submissions...</p>
          ) : sortedSubmissions.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No student submissions yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {sortedSubmissions.map((submission) => {
                const form = gradeForms[submission.id] ?? { grade: "", feedback: "" };
                return (
                  <article key={submission.id} className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            submission.grade === null
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {statusLabel(submission)}
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Student #{submission.student_id}
                        </p>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-slate-950">
                        {submission.assignmentTitle}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{submission.courseTitle}</p>
                      <p className="mt-4 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                        {submission.content}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Submitted {formatDate(submission.submitted_at)}
                      </p>
                    </div>
                    <form className="space-y-3" onSubmit={(event) => void handleGrade(event, submission)}>
                      <label className="text-sm font-medium text-slate-700">
                        Grade out of {submission.maxPoints}
                        <input
                          type="number"
                          min="0"
                          max={submission.maxPoints}
                          step="1"
                          value={form.grade}
                          onChange={(event) => updateGradeForm(submission.id, { grade: event.target.value })}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          required
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Feedback
                        <textarea
                          value={form.feedback}
                          onChange={(event) => updateGradeForm(submission.id, { feedback: event.target.value })}
                          rows={4}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={gradingId === submission.id}
                        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {gradingId === submission.id ? "Saving grade..." : "Save grade"}
                      </button>
                      {submission.graded_at ? (
                        <p className="text-xs text-slate-500">Last graded {formatDate(submission.graded_at)}</p>
                      ) : null}
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
