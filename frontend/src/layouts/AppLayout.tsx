import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types/auth";
import type { NavItem } from "../types/navigation";

type AppNavItem = NavItem & {
  roles?: UserRole[];
  publicOnly?: boolean;
};

const navItems: AppNavItem[] = [
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
  { label: "Admin Dashboard", path: "/admin/dashboard", roles: ["admin"] },
  { label: "Admin Courses", path: "/admin/courses", roles: ["admin"] },
  { label: "Instructor Dashboard", path: "/instructor/dashboard", roles: ["instructor"] },
  { label: "Instructor Courses", path: "/instructor/courses", roles: ["instructor"] },
  { label: "Instructor Assignments", path: "/instructor/assignments", roles: ["instructor"] },
  { label: "Instructor Submissions", path: "/instructor/submissions", roles: ["instructor"] },
  { label: "Student Dashboard", path: "/student/dashboard", roles: ["student"] },
  { label: "Student Courses", path: "/student/courses", roles: ["student"] },
  { label: "Student Assignments", path: "/student/assignments", roles: ["student"] },
  { label: "Student Grades", path: "/student/grades", roles: ["student"] },
  { label: "System Health", path: "/system-health" }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-lg font-bold text-slate-950">CourseGrid</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            LMS Prototype
          </p>
        </div>
        <nav className="space-y-1">
          {navItems
            .filter((item) => {
              if (isAuthenticated) {
                if (item.path === "/login" || item.path === "/register") {
                  return false;
                }
                return !item.roles || item.roles.includes(user!.role);
              }
              return item.path === "/login" || item.path === "/register";
            })
            .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user ? (
          <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </aside>
      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-base font-bold text-slate-950">CourseGrid LMS</p>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
