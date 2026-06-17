import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCourse, fetchCourses, updateCourse } from "../../api/courses";
import { CourseForm } from "../../components/CourseForm";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course, CoursePayload } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setCourses(await fetchCourses());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load your courses."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  async function handleSubmit(payload: CoursePayload) {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        setSuccess("Course updated.");
      } else {
        await createCourse(payload);
        setSuccess("Course created.");
      }
      setEditingCourse(null);
      await loadCourses();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save course."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Instructor Courses"
        description="Create and manage the courses assigned to your instructor account."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        <CourseForm
          course={editingCourse}
          isSubmitting={isSubmitting}
          submitLabel={editingCourse ? "Update course" : "Create course"}
          onSubmit={handleSubmit}
          onCancel={editingCourse ? () => setEditingCourse(null) : undefined}
        />
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              My courses
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No instructor courses yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {courses.map((course) => (
                <article key={course.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-950">{course.title}</h3>
                      <CourseStatusBadge status={course.status} />
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">{course.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/instructor/courses/${course.id}`}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditingCourse(course)}
                      className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Edit
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
