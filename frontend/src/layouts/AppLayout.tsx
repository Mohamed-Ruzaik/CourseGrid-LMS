import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  UsersRound
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types/auth";
import type { NavItem } from "../types/navigation";

type AppNavItem = NavItem & {
  roles?: UserRole[];
  publicOnly?: boolean;
  icon?: ComponentType<{ className?: string }>;
};

const navItems: AppNavItem[] = [
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
  { label: "Dashboard", path: "/admin/dashboard", roles: ["admin"], icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", roles: ["admin"], icon: UsersRound },
  { label: "Courses", path: "/admin/courses", roles: ["admin"], icon: BookOpen },
  { label: "Dashboard", path: "/instructor/dashboard", roles: ["instructor"], icon: LayoutDashboard },
  { label: "My Courses", path: "/instructor/courses", roles: ["instructor"], icon: BookOpen },
  { label: "Assignments", path: "/instructor/assignments", roles: ["instructor"], icon: ClipboardList },
  { label: "Submissions", path: "/instructor/submissions", roles: ["instructor"], icon: GraduationCap },
  { label: "Dashboard", path: "/student/dashboard", roles: ["student"], icon: LayoutDashboard },
  { label: "My Courses", path: "/student/courses", roles: ["student"], icon: BookOpen },
  { label: "Assignments", path: "/student/assignments", roles: ["student"], icon: ClipboardList },
  { label: "Grades", path: "/student/grades", roles: ["student"], icon: GraduationCap }
];

function getInitials(name?: string) {
  if (!name) {
    return "CG";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthenticated = Boolean(user);
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthRoute) {
    return <Outlet />;
  }

  const visibleNavItems = navItems.filter((item) => {
    if (isAuthenticated) {
      if (item.path === "/login" || item.path === "/register") {
        return false;
      }
      return !item.roles || item.roles.includes(user!.role);
    }
    return item.path === "/login" || item.path === "/register";
  });

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-[280px] border-r border-white/10 bg-slate-900 text-white shadow-2xl shadow-slate-900/20 lg:flex lg:flex-col">
        <div className="flex h-[92px] items-center gap-3 border-b border-white/10 px-8">
          <div className="grid h-10 w-10 grid-cols-2 gap-1 rounded-xl">
            <span className="rounded-md bg-blue-500" />
            <span className="rounded-md bg-blue-500" />
            <span className="rounded-md bg-blue-500" />
            <span className="rounded-md bg-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">
              Course<span className="text-blue-400">Grid</span>
              <span className="ml-2 text-sm font-medium text-slate-400">LMS</span>
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-3 px-4 py-7">
          {visibleNavItems.map((item) => {
            const Icon = item.icon ?? LayoutDashboard;
            return (
            <NavLink
              key={`${item.label}-${item.path}`}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-medium transition",
                  isActive
                    ? "bg-white/10 text-blue-400 shadow-lg shadow-slate-950/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
            );
          })}
        </nav>

        {user ? (
          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-base font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Log out
            </button>
          </div>
        ) : null}
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 flex min-h-[92px] items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-10">
          <div className="hidden w-full max-w-xl items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex">
            <input
              type="search"
              placeholder="Search courses, lessons..."
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-500"
            />
            <Search className="h-6 w-6 text-slate-500" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-4 lg:hidden">
            <div className="grid h-9 w-9 grid-cols-2 gap-1 rounded-lg">
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
            </div>
            <p className="text-lg font-bold">CourseGrid</p>
          </div>

          {user ? (
            <div className="ml-auto flex items-center gap-5">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-sm font-bold text-slate-900">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-950">{user.name}</p>
                  <p className="text-sm capitalize text-slate-500">{user.role}</p>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <main className="min-h-[calc(100vh-92px)] px-5 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
