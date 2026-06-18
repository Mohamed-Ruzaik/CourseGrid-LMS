import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAssignmentStudents,
  fetchCourseAssignments,
  gradeSubmission
} from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type {
  Assignment,
  AssignmentStudentSubmission,
  GradePayload
} from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

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

export function InstructorSubmissionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentRows, setStudentRows] = useState<AssignmentStudentSubmission[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [openSubmissionId, setOpenSubmissionId] = useState<number | null>(null);
  const [gradeForms, setGradeForms] = useState<Record<number, GradeFormState>>({});
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => String(assignment.id) === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId]
  );

  const loadCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    setError("");
    try {
      const courseData = await fetchCourses();
      setCourses(courseData);
      setSelectedCourseId((current) => current || (courseData[0] ? String(courseData[0].id) : ""));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load courses."));
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!selectedCourseId) {
      setAssignments([]);
      setSelectedAssignmentId("");
      return;
    }

    setIsLoadingAssignments(true);
    setError("");
    try {
      const assignmentData = await fetchCourseAssignments(selectedCourseId);
      setAssignments(assignmentData);
      setSelectedAssignmentId((current) => {
        if (assignmentData.some((assignment) => String(assignment.id) === current)) {
          return current;
        }
        return assignmentData[0] ? String(assignmentData[0].id) : "";
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load assignments."));
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [selectedCourseId]);

  const loadStudents = useCallback(async () => {
    if (!selectedAssignmentId) {
      setStudentRows([]);
      setGradeForms({});
      return;
    }

    setIsLoadingStudents(true);
    setError("");
    try {
      const rows = await fetchAssignmentStudents(Number(selectedAssignmentId));
      setStudentRows(rows);
      setGradeForms(
        rows.reduce<Record<number, GradeFormState>>((forms, row) => {
          if (row.submission) {
            forms[row.submission.id] = {
              grade: row.submission.grade === null ? "" : String(row.submission.grade),
              feedback: row.submission.feedback ?? ""
            };
          }
          return forms;
        }, {})
      );
      setOpenSubmissionId(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load student submissions."));
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

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

  async function handleGrade(event: FormEvent<HTMLFormElement>, row: AssignmentStudentSubmission) {
    event.preventDefault();
    if (!row.submission) {
      return;
    }

    const form = gradeForms[row.submission.id];
    const payload: GradePayload = {
      grade: Number(form?.grade ?? 0),
      feedback: form?.feedback ?? ""
    };

    setGradingId(row.submission.id);
    setError("");
    setSuccess("");
    try {
      await gradeSubmission(row.submission.id, payload);
      setSuccess("Submission graded.");
      await loadStudents();
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
        description="Select a course and assignment, then review each enrolled student's submission status."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="submission-course">
              Course
              <select
                id="submission-course"
                value={selectedCourseId}
                onChange={(event) => {
                  setSelectedCourseId(event.target.value);
                  setSelectedAssignmentId("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {isLoadingCourses ? <option value="">Loading courses...</option> : null}
                {!isLoadingCourses && courses.length === 0 ? <option value="">No courses available</option> : null}
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700" htmlFor="submission-assignment">
              Assignment
              <select
                id="submission-assignment"
                value={selectedAssignmentId}
                onChange={(event) => setSelectedAssignmentId(event.target.value)}
                disabled={!selectedCourseId || isLoadingAssignments}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {isLoadingAssignments ? <option value="">Loading assignments...</option> : null}
                {!isLoadingAssignments && assignments.length === 0 ? (
                  <option value="">No assignments for this course</option>
                ) : null}
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Student submissions
            </h2>
            {selectedAssignment ? (
              <p className="mt-1 text-sm text-slate-600">
                {selectedAssignment.title} - {selectedAssignment.max_points} points
              </p>
            ) : null}
          </div>

          {isLoadingStudents ? (
            <p className="p-5 text-sm text-slate-600">Loading students...</p>
          ) : !selectedAssignmentId ? (
            <p className="p-5 text-sm text-slate-600">Select an assignment to view students.</p>
          ) : studentRows.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No enrolled students for this course.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {studentRows.map((row) => {
                const submission = row.submission;
                const form = submission
                  ? gradeForms[submission.id] ?? { grade: "", feedback: "" }
                  : { grade: "", feedback: "" };
                const isOpen = submission ? openSubmissionId === submission.id : false;

                return (
                  <article key={row.student_id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              row.submitted
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            ].join(" ")}
                          >
                            {row.submitted ? "Submitted" : "Not submitted"}
                          </span>
                          {submission?.grade !== null && submission?.grade !== undefined ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              Graded: {submission.grade}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 text-base font-bold text-slate-950">{row.student_name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Student #{row.student_id} - {row.student_email}
                        </p>
                        {submission ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted {formatDate(submission.submitted_at)}
                          </p>
                        ) : null}
                      </div>

                      {submission ? (
                        <button
                          type="button"
                          onClick={() => setOpenSubmissionId(isOpen ? null : submission.id)}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {isOpen ? "Close submission" : "Open submission"}
                        </button>
                      ) : null}
                    </div>

                    {submission && isOpen ? (
                      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Submission</p>
                          <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                            {submission.content}
                          </p>
                        </div>
                        <form className="space-y-3" onSubmit={(event) => void handleGrade(event, row)}>
                          <label className="text-sm font-medium text-slate-700">
                            Marks out of {selectedAssignment?.max_points ?? 0}
                            <input
                              type="number"
                              min="0"
                              max={selectedAssignment?.max_points ?? undefined}
                              step="1"
                              value={form.grade}
                              onChange={(event) =>
                                updateGradeForm(submission.id, { grade: event.target.value })
                              }
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                              required
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Feedback
                            <textarea
                              value={form.feedback}
                              onChange={(event) =>
                                updateGradeForm(submission.id, { feedback: event.target.value })
                              }
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
                            <p className="text-xs text-slate-500">
                              Last graded {formatDate(submission.graded_at)}
                            </p>
                          ) : null}
                        </form>
                      </div>
                    ) : null}
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
