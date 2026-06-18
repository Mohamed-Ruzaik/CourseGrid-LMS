import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { fetchCourses } from "../../api/courses";
import { createAdminUser, fetchAdminUser, updateAdminUser } from "../../api/users";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { UserRole } from "../../types/auth";
import type { Course } from "../../types/course";
import type { AdminUser, AdminUserPayload } from "../../types/user";
import { getApiErrorMessage } from "../../utils/errorMessage";

const roles: UserRole[] = ["admin", "instructor", "student"];

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  enrolled_course_ids: number[];
  instructor_course_ids: number[];
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "student",
  is_active: true,
  enrolled_course_ids: [],
  instructor_course_ids: []
};

function toFormState(user: AdminUser): UserFormState {
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    is_active: user.is_active,
    enrolled_course_ids: user.enrolled_course_ids,
    instructor_course_ids: user.instructor_course_ids
  };
}

function formatRole(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function hasCourse(courseIds: number[], courseId: number) {
  return courseIds.includes(courseId);
}

function toggleCourse(courseIds: number[], courseId: number) {
  if (courseIds.includes(courseId)) {
    return courseIds.filter((id) => id !== courseId);
  }
  return [...courseIds, courseId];
}

type AdminUserFormPageProps = {
  mode: "create" | "edit";
};

function AdminUserFormPage({ mode }: AdminUserFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = mode === "edit";
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [courseData, userData] = await Promise.all([
        fetchCourses(),
        isEditMode && id ? fetchAdminUser(id) : Promise.resolve(null)
      ]);
      setCourses(courseData);
      setForm(userData ? toFormState(userData) : emptyForm);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load user form data."));
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isEditMode && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const payload: AdminUserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      is_active: form.is_active,
      enrolled_course_ids: form.enrolled_course_ids,
      instructor_course_ids: form.role === "instructor" ? form.instructor_course_ids : []
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && id) {
        await updateAdminUser(Number(id), payload);
      } else {
        await createAdminUser({ ...payload, password: form.password });
      }
      navigate("/admin/users");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save user."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isEditMode ? "Edit User" : "Create User"}
        description={
          isEditMode
            ? "Update account details, active status, enrollments, and instructor course access."
            : "Create a user account with a role, password, and optional course access."
        }
      />

      <div className="space-y-5 p-6">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to users
        </Link>

        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {isLoading ? <MessageBox>Loading user form...</MessageBox> : null}

        {!isLoading ? (
          <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {isEditMode ? "Account details" : "New account"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isEditMode
                    ? "Password is optional. Leave it blank to keep the current password."
                    : "Password is required when creating a new account."}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <UserPlus className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="admin-user-name">
                  Name
                </label>
                <input
                  id="admin-user-name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  minLength={2}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="admin-user-email">
                  Email
                </label>
                <input
                  id="admin-user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="admin-user-password">
                  Password
                </label>
                <input
                  id="admin-user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  required={!isEditMode}
                  minLength={isEditMode && !form.password ? undefined : 8}
                  placeholder={isEditMode ? "Leave blank to keep current password" : "Minimum 8 characters"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="admin-user-role">
                  Role
                </label>
                <select
                  id="admin-user-role"
                  value={form.role}
                  onChange={(event) => updateForm("role", event.target.value as UserRole)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateForm("is_active", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Active account
            </label>

            <CourseChecklist
              title="Enrollments"
              description="Courses this user is enrolled in."
              courses={courses}
              selectedCourseIds={form.enrolled_course_ids}
              onToggle={(courseId) =>
                updateForm("enrolled_course_ids", toggleCourse(form.enrolled_course_ids, courseId))
              }
            />

            {form.role === "instructor" ? (
              <CourseChecklist
                title="Instructor courses"
                description="Courses this instructor can manage. Multiple instructors can be assigned to the same course."
                courses={courses}
                selectedCourseIds={form.instructor_course_ids}
                onToggle={(courseId) =>
                  updateForm(
                    "instructor_course_ids",
                    toggleCourse(form.instructor_course_ids, courseId)
                  )
                }
              />
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Saving..." : isEditMode ? "Update user" : "Create user"}
              </button>
              <Link
                to="/admin/users"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : null}
      </div>
    </>
  );
}

export function AdminUserCreatePage() {
  return <AdminUserFormPage mode="create" />;
}

export function AdminUserEditPage() {
  return <AdminUserFormPage mode="edit" />;
}

type CourseChecklistProps = {
  title: string;
  description: string;
  courses: Course[];
  selectedCourseIds: number[];
  onToggle: (courseId: number) => void;
};

function CourseChecklist({
  title,
  description,
  courses,
  selectedCourseIds,
  onToggle
}: CourseChecklistProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <p className="text-sm font-semibold text-slate-500">{selectedCourseIds.length} selected</p>
      </div>

      {courses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No courses available.</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {courses.map((course) => (
            <label
              key={`${title}-${course.id}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm hover:bg-slate-100"
            >
              <input
                type="checkbox"
                checked={hasCourse(selectedCourseIds, course.id)}
                onChange={() => onToggle(course.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>
                <span className="block font-semibold text-slate-950">{course.title}</span>
                <span className="mt-1 block text-xs text-slate-500">Course ID #{course.id}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
