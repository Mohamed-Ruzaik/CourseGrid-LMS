import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, UserCog } from "lucide-react";
import { fetchAdminUsers } from "../../api/users";
import { MessageBox } from "../../components/MessageBox";
import { PageHeader } from "../../components/PageHeader";
import type { UserRole } from "../../types/auth";
import type { AdminUser } from "../../types/user";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatRole(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setUsers(await fetchAdminUsers());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Could not load users."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="Search users, review roles and status, then open dedicated create or edit pages."
      />

      <div className="space-y-5 p-6">
        {error ? <MessageBox tone="error">{error}</MessageBox> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Users</h2>
              <p className="mt-1 text-sm text-slate-600">
                Search by name, email, ID, or role.
              </p>
            </div>
            <Link
              to="/admin/users/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create user
            </Link>
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
                        <Link
                          to={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <UserCog className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Link>
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
