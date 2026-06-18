import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { createModule } from "../../api/content";
import { createCourse } from "../../api/courses";
import { fetchAdminUsers } from "../../api/users";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { CourseStatus } from "../../types/course";
import type { AdminUser } from "../../types/user";
import { getApiErrorMessage } from "../../utils/errorMessage";

type InstructorOption = Pick<AdminUser, "id" | "name" | "email" | "role" | "is_active">;

const statuses: CourseStatus[] = ["draft", "published", "archived"];

export function AdminCourseCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseStatus>("draft");
  const [moduleCount, setModuleCount] = useState("3");
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadInstructors = useCallback(async () => {
    setIsLoadingInstructors(true);
    try {
      const users = await fetchAdminUsers();
      setInstructors(users.filter((user) => user.role === "instructor" && user.is_active));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load instructors."));
    } finally {
      setIsLoadingInstructors(false);
    }
  }, []);

  useEffect(() => {
    void loadInstructors();
  }, [loadInstructors]);

  const canSubmit = useMemo(
    () => title.trim().length >= 3 && selectedInstructorIds.length > 0 && Number(moduleCount) >= 0,
    [moduleCount, selectedInstructorIds.length, title]
  );

  function toggleInstructor(instructorId: number) {
    setSelectedInstructorIds((current) => {
      if (current.includes(instructorId)) {
        return current.filter((id) => id !== instructorId);
      }
      return [...current, instructorId];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (selectedInstructorIds.length === 0) {
      setError("Select at least one instructor.");
      return;
    }

    try {
      setIsSubmitting(true);
      const course = await createCourse({
        title: title.trim(),
        description: description.trim(),
        status,
        instructor_id: selectedInstructorIds[0],
        instructor_ids: selectedInstructorIds
      });

      const count = Math.max(0, Number(moduleCount) || 0);
      await Promise.all(
        Array.from({ length: count }, (_, index) =>
          createModule(course.id, {
            title: `Module ${index + 1}`,
            position: index + 1
          })
        )
      );

      navigate(`/admin/courses/${course.id}/builder`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not create course."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create Course"
        description="Create the course shell, assign instructors, choose module count, then continue into the builder."
      />
      <div className="space-y-5 p-6">
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to courses
        </Link>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}

        <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Course setup</h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep this step focused. Detailed lessons, slides, and assignments are handled in the builder after creation.
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="course-title">
                Title
              </label>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={3}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Web Development Fundamentals"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="course-status">
                Status
              </label>
              <select
                id="course-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as CourseStatus)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700" htmlFor="course-description">
              Description
            </label>
            <textarea
              id="course-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Describe what students will learn in this course."
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700" htmlFor="module-count">
              Number of modules
            </label>
            <input
              id="module-count"
              type="number"
              min={0}
              max={20}
              value={moduleCount}
              onChange={(event) => setModuleCount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-60"
            />
            <p className="mt-2 text-sm text-slate-500">
              These modules are created as editable placeholders in the next step.
            </p>
          </div>

          <section className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-950">Instructors</h3>
                <p className="text-sm text-slate-600">Select one or more instructors from the active instructor list.</p>
              </div>
              <p className="text-sm font-semibold text-slate-500">{selectedInstructorIds.length} selected</p>
            </div>

            {isLoadingInstructors ? (
              <p className="mt-4 text-sm text-slate-600">Loading instructors...</p>
            ) : instructors.length === 0 ? (
              <MessageBox>No active instructors found. Create an instructor user first.</MessageBox>
            ) : (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {instructors.map((instructor) => (
                  <label
                    key={instructor.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstructorIds.includes(instructor.id)}
                      onChange={() => toggleInstructor(instructor.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>
                      <span className="block font-semibold text-slate-950">{instructor.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        #{instructor.id} - {instructor.email}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Creating..." : "Create and edit modules"}
            </button>
            <Link
              to="/admin/courses"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
