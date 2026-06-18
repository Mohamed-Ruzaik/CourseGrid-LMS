import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { fetchCourses } from "../../api/courses";
import { CourseStatusBadge } from "../../components/CourseStatusBadge";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { Course } from "../../types/course";
import { getApiErrorMessage } from "../../utils/errorMessage";

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setCourses(await fetchCourses({ enrolled: true }));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load your courses."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  return (
    <>
      <PageHeader
        title="My Courses"
        description="Your registered course list. Open a course to view modules, slides, and assignments."
      />
      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? (
          <MessageBox>Loading your courses...</MessageBox>
        ) : courses.length === 0 ? (
          <MessageBox>You are not registered for any courses yet.</MessageBox>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/student/courses/${course.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <BookOpen className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <CourseStatusBadge status={course.status} />
                </div>
                <h2 className="mt-5 text-lg font-bold text-slate-950">{course.title}</h2>
                <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                  {course.description || "No description provided."}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-600">
                  Open course
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
