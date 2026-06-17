import { useCallback, useEffect, useState } from "react";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  updateCourse
} from "../../api/courses";
import { CourseForm } from "../../components/CourseForm";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course, CoursePayload } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function AdminCoursesPage() {
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
      setError(getApiErrorMessage(loadError, "Could not load courses."));
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

  async function handleDelete(courseId: number) {
    setError("");
    setSuccess("");
    try {
      await deleteCourse(courseId);
      setSuccess("Course deleted.");
      await loadCourses();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not delete course."));
    }
  }

  return (
    <>
      <PageHeader
        title="Admin Courses"
        description="Create, edit, and delete courses across the platform."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}
        <CourseForm
          course={editingCourse}
          showInstructorField
          isSubmitting={isSubmitting}
          submitLabel={editingCourse ? "Update course" : "Create course"}
          onSubmit={handleSubmit}
          onCancel={editingCourse ? () => setEditingCourse(null) : undefined}
        />
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              All courses
            </h2>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-600">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No courses created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Instructor ID</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{course.title}</p>
                        <p className="mt-1 max-w-xl text-slate-600">{course.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <CourseStatusBadge status={course.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">{course.instructor_id}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCourse(course)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(course.id)}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
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
