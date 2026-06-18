import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { createModule } from "../../api/content";
import { createCourse } from "../../api/courses";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { CourseStatus } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

const statuses: CourseStatus[] = ["draft", "published", "archived"];

export function InstructorCourseCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseStatus>("draft");
  const [moduleCount, setModuleCount] = useState("3");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      const course = await createCourse({
        title: title.trim(),
        description: description.trim(),
        status
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
      navigate(`/instructor/courses/${course.id}`);
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
        description="Create a course shell, choose module count, then manage slides and assignments from the course page."
      />
      <div className="space-y-5 p-6">
        <Link
          to="/instructor/courses"
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
                Add the course details now. Modules can be renamed and expanded after creation.
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
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Creating..." : "Create course"}
            </button>
            <Link
              to="/instructor/courses"
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
