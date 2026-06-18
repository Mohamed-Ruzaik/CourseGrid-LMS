import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Settings, Trash2 } from "lucide-react";
import { deleteCourse, fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  const filteredCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return courses;
    }

    return courses.filter((course) =>
      [course.title, course.description, course.status, String(course.id), String(course.instructor_id)]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [courses, query]);

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
        description="Search courses, review instructors, and open the course builder."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Courses</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create courses separately, then continue into modules and lessons.
              </p>
            </div>
            <Link
              to="/admin/courses/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create course
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
              placeholder="Search courses by title, ID, status, or instructor ID"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            {isLoading ? (
              <p className="py-8 text-sm text-slate-600">Loading courses...</p>
            ) : filteredCourses.length === 0 ? (
              <p className="py-8 text-sm text-slate-600">No courses match your search.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Instructors</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                            <BookOpen className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{course.title}</p>
                            <p className="mt-1 max-w-2xl text-slate-600">{course.description || "No description"}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">Course ID #{course.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <CourseStatusBadge status={course.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {(course.instructor_ids?.length ? course.instructor_ids : [course.instructor_id])
                          .map((id) => `#${id}`)
                          .join(", ")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/admin/courses/${course.id}/builder`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Settings className="h-4 w-4" aria-hidden="true" />
                            Builder
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(course.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
