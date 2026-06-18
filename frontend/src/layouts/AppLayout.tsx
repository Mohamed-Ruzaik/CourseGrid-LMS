import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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
  { label: "Submissions", path: "/instructor/submissions", roles: ["instructor"], icon: GraduationCap },
  { label: "Dashboard", path: "/student/dashboard", roles: ["student"], icon: LayoutDashboard },
  { label: "My Courses", path: "/student/courses", roles: ["student"], icon: BookOpen },
  { label: "Assignments", path: "/student/assignments", roles: ["student"], icon: ClipboardList },
  { label: "Grades", path: "/student/grades", roles: ["student"], icon: GraduationCap },
  { label: "Settings", path: "/settings", roles: ["admin", "instructor", "student"], icon: Settings }
];

const SIDEBAR_PIN_STORAGE_KEY = "coursegrid_sidebar_pinned";

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
  const [isSidebarPinned, setIsSidebarPinned] = useState(
    () => window.localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY) === "true"
  );
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isAuthenticated = Boolean(user);
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";
  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered;

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_PIN_STORAGE_KEY, String(isSidebarPinned));
  }, [isSidebarPinned]);

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

  const activeNavItem = visibleNavItems
    .filter((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
    .sort((first, second) => second.path.length - first.path.length)[0];
  const pageTitle = activeNavItem?.label ?? "CourseGrid";

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-slate-950 lg:grid lg:grid-cols-[auto_1fr]">
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={[
          "sticky top-0 hidden h-screen overflow-auto border-r border-white/10 bg-slate-800 text-white shadow-2xl shadow-slate-900/15 transition-[width] duration-200 lg:flex lg:flex-col",
          isSidebarCollapsed
            ? "w-[84px]"
            : "min-w-[220px] max-w-[340px] resize-x lg:w-[260px]"
        ].join(" ")}
      >
        <div
          className={[
            "flex h-[92px] items-center border-b border-white/10 px-6",
            isSidebarCollapsed ? "justify-center" : "justify-between gap-3"
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 grid-cols-2 gap-1 rounded-lg">
            <span className="rounded bg-blue-500" />
            <span className="rounded bg-blue-500" />
            <span className="rounded bg-blue-500" />
            <span className="rounded bg-blue-500" />
          </div>
          {!isSidebarCollapsed ? (
            <p className="text-lg font-bold tracking-tight">
              Course<span className="text-blue-400">Grid</span>
              <span className="ml-2 text-sm font-medium text-slate-400">LMS</span>
            </p>
          ) : null}
          </div>
          {!isSidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsSidebarPinned((current) => !current)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isSidebarPinned ? (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>

        <nav className={["flex-1 space-y-3 py-7", isSidebarCollapsed ? "px-3" : "px-4"].join(" ")}>
          {isSidebarCollapsed ? (
            <div
              className="mb-4 grid h-12 w-full place-items-center rounded-xl text-slate-400"
              aria-hidden="true"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </div>
          ) : null}
          {visibleNavItems.map((item) => {
            const Icon = item.icon ?? LayoutDashboard;
            return (
            <NavLink
              key={`${item.label}-${item.path}`}
              to={item.path}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "flex items-center rounded-xl text-base font-medium transition",
                  isSidebarCollapsed ? "justify-center px-0 py-4" : "gap-4 px-4 py-4",
                  isActive
                    ? "bg-white/15 text-blue-200 shadow-lg shadow-slate-950/10"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {!isSidebarCollapsed ? item.label : null}
            </NavLink>
            );
          })}
        </nav>

        {user ? (
          <div className={["border-t border-white/10 p-4", isSidebarCollapsed ? "px-3" : ""].join(" ")}>
            <button
              type="button"
              onClick={logout}
              title={isSidebarCollapsed ? "Log out" : undefined}
              className={[
                "flex w-full items-center rounded-xl py-4 text-base font-medium text-slate-200 transition hover:bg-white/10 hover:text-white",
                isSidebarCollapsed ? "justify-center px-0" : "gap-4 px-4"
              ].join(" ")}
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              {!isSidebarCollapsed ? "Log out" : null}
            </button>
          </div>
        ) : null}
      </aside>

      <div>
        <header className="sticky top-0 z-20 flex min-h-[92px] items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 lg:hidden">
            <div className="grid h-8 w-8 grid-cols-2 gap-1 rounded-lg">
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
              <span className="rounded bg-blue-500" />
            </div>
            <p className="text-lg font-bold">CourseGrid</p>
          </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">{pageTitle}</h1>
            </div>
          </div>

          {user ? (
            <div className="ml-auto flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-sm font-bold text-slate-900">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
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
