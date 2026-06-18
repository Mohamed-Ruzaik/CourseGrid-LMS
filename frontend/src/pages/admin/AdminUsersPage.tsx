import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, UserCog, X } from "lucide-react";
import { createAdminUser, fetchAdminUsers, updateAdminUser } from "../../api/users";
import { fetchCourses } from "../../api/courses";
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

function hasCourse(courseIds: number[], courseId: number) {
  return courseIds.includes(courseId);
}

function toggleCourse(courseIds: number[], courseId: number) {
  if (courseIds.includes(courseId)) {
    return courseIds.filter((id) => id !== courseId);
  }
  return [...courseIds, courseId];
}

function formatRole(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [userData, courseData] = await Promise.all([fetchAdminUsers(), fetchCourses()]);
      setUsers(userData);
      setCourses(courseData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load user management data."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, String(user.id), user.role]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [query, users]);

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  }

  function openEditForm(user: AdminUser) {
    setEditingUser(user);
    setForm(toFormState(user));
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!editingUser && form.password.length < 8) {
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
      if (editingUser) {
        await updateAdminUser(editingUser.id, payload);
        setSuccess("User updated.");
      } else {
        await createAdminUser({ ...payload, password: form.password });
        setSuccess("User created.");
      }
      closeForm();
      await loadData();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Could not save user."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="List users, create accounts, and manage roles, active status, enrollments, and instructor course assignments."
      />

      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}
        {success ? <MessageBox tone="success">{success}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Users</h2>
              <p className="mt-1 text-sm text-slate-600">
                Search by name, email, ID, or role.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create user
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
              placeholder="Search users by name, ID, or email"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            {isLoading ? (
              <p className="py-8 text-sm text-slate-600">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="py-8 text-sm text-slate-600">No users match your search.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrollments</th>
                    <th className="px-4 py-3">Instructor Courses</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{user.name}</p>
                        <p className="mt-1 text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">#{user.id}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            user.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          ].join(" ")}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{user.enrolled_course_ids.length}</td>
                      <td className="px-4 py-4 text-slate-600">{user.instructor_course_ids.length}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openEditForm(user)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <UserCog className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {isFormOpen ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingUser ? "Edit user" : "Create user"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {editingUser
                    ? "Update account details, status, password, enrollments, and instructor courses."
                    : "Create an account with name, email, password, and role."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Close user form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
                    required={!editingUser}
                    minLength={editingUser && !form.password ? undefined : 8}
                    placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 8 characters"}
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
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? "Saving..." : editingUser ? "Update user" : "Create user"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
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
