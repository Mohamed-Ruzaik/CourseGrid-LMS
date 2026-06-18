import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Settings } from "lucide-react";
import { fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const filteredCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return courses;
    }

    return courses.filter((course) =>
      [course.title, course.description, course.status, String(course.id)].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [courses, query]);

  return (
    <>
      <PageHeader
        title="Instructor Courses"
        description="Create courses and manage assigned course modules, lecture slides, and assignments."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">My courses</h2>
              <p className="mt-1 text-sm text-slate-600">
                Courses assigned to your instructor account.
              </p>
            </div>
            <Link
              to="/instructor/courses/create"
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
              placeholder="Search courses by title, ID, or status"
            />
          </div>

          {isLoading ? (
            <p className="py-8 text-sm text-slate-600">Loading courses...</p>
          ) : filteredCourses.length === 0 ? (
            <p className="py-8 text-sm text-slate-600">No instructor courses found.</p>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-3 md:grid-cols-2">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className="flex min-h-[220px] flex-col rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                      <BookOpen className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <CourseStatusBadge status={course.status} />
                  </div>
                  <div className="mt-4 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Course #{course.id}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-950">{course.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {course.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to={`/instructor/courses/${course.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Open
                    </Link>
                    <Link
                      to={`/instructor/courses/${course.id}/builder`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Builder
                    </Link>
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
