import { FormEvent, useEffect, useState } from "react";
import type { Course, CoursePayload, CourseStatus } from "../types/course";

type CourseFormProps = {
  course?: Course | null;
  showInstructorField?: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (payload: CoursePayload) => Promise<void>;
  onCancel?: () => void;
};

const courseStatuses: CourseStatus[] = ["draft", "published", "archived"];

export function CourseForm({
  course,
  showInstructorField = false,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel
}: CourseFormProps) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [status, setStatus] = useState<CourseStatus>(course?.status ?? "published");
  const [instructorId, setInstructorId] = useState(
    course?.instructor_id ? String(course.instructor_id) : ""
  );

  useEffect(() => {
    setTitle(course?.title ?? "");
    setDescription(course?.description ?? "");
    setStatus(course?.status ?? "published");
    setInstructorId(course?.instructor_id ? String(course.instructor_id) : "");
  }, [course]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CoursePayload = {
      title,
      description,
      status
    };

    if (showInstructorField && instructorId.trim()) {
      payload.instructor_id = Number(instructorId);
    }

    await onSubmit(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="course-title">
            Title
          </label>
          <input
            id="course-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={3}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="course-status">
            Status
          </label>
          <select
            id="course-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CourseStatus)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {courseStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showInstructorField ? (
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="instructor-id">
            Instructor ID
          </label>
          <input
            id="instructor-id"
            type="number"
            min={1}
            value={instructorId}
            onChange={(event) => setInstructorId(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      ) : null}
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="course-description">
          Description
        </label>
        <textarea
          id="course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
