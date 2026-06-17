import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createAssignment,
  deleteAssignment,
  fetchCourseAssignments,
  updateAssignment
} from "../../api/assignments";
import { fetchCourses } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Assignment, AssignmentPayload } from "../../types/assignment";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

type AssignmentWithCourse = Assignment & {
  courseTitle: string;
};

const emptyForm = {
  courseId: "",
  title: "",
  description: "",
  dueDate: "",
  maxPoints: "100"
};

function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function InstructorAssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const courseOptions = useMemo(() => courses.filter((course) => course.status !== "archived"), [courses]);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const loadedCourses = await fetchCourses();
      setCourses(loadedCourses);
      const assignmentGroups = await Promise.all(
        loadedCourses.map(async (course) => {
          const courseAssignments = await fetchCourseAssignments(course.id);
          return courseAssignments.map((assignment) => ({
            ...assignment,
            courseTitle: course.title
          }));
        })
      );
      setAssignments(assignmentGroups.flat());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load assignments."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!form.courseId && courseOptions.length > 0 && !editingAssignment) {
      setForm((current) => ({ ...current, courseId: String(courseOptions[0].id) }));
    }
  }, [courseOptions, editingAssignment, form.courseId]);

  function startEditing(assignment: AssignmentWithCourse) {
    setEditingAssignment(assignment);
    setForm({
      courseId: String(assignment.course_id),
      title: assignment.title,
      description: assignment.description,
      dueDate: toDateTimeInput(assignment.due_date),
      maxPoints: String(assignment.max_points)
    });
    setSuccess("");
    setError("");
  }

  function resetForm() {
    setEditingAssignment(null);
    setForm({
      ...emptyForm,
      courseId: courseOptions.length > 0 ? String(courseOptions[0].id) : ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const payload: AssignmentPayload = {
      title: form.title,
      description: form.description,
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      max_points: Number(form.maxPoints)
    };

    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, payload);
        setSuccess("Assignment updated.");
      } else {
        await createAssignment(form.courseId, payload);
        setSuccess("Assignment created.");
      }
      resetForm();
      await loadAssignments();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save assignment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(assignment: AssignmentWithCourse) {
    setDeletingId(assignment.id);
    setError("");
    setSuccess("");
    try {
      await deleteAssignment(assignment.id);
      setSuccess("Assignment deleted.");
      await loadAssignments();
      if (editingAssignment?.id === assignment.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete assignment."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Instructor Assignments"
        description="Create text-based assignments for your courses and keep grading scope simple for v1."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingAssignment ? "Edit assignment" : "New assignment"}
            </h2>
          </div>
          <form className="grid gap-4 p-5 lg:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <label className="text-sm font-medium text-slate-700">
              Course
              <select
                value={form.courseId}
                onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}
                disabled={Boolean(editingAssignment)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
                required
              >
                {courseOptions.length === 0 ? <option value="">No courses available</option> : null}
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Title
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Due date
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Max points
              <input
                type="number"
                min="0"
                step="1"
                value={form.maxPoints}
                onChange={(event) => setForm((current) => ({ ...current, maxPoints: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700 lg:col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting || courseOptions.length === 0}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : editingAssignment ? "Update assignment" : "Create assignment"}
              </button>
              {editingAssignment ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Course assignments
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No assignments have been created yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {assignments.map((assignment) => (
                <article key={assignment.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {assignment.courseTitle}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">{assignment.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      {assignment.description || "No description provided."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(assignment.due_date)} · {assignment.max_points} points
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(assignment)}
                      className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(assignment)}
                      disabled={deletingId === assignment.id}
                      className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === assignment.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
