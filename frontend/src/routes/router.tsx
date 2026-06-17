import { Navigate, createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AppLayout } from "../layouts/AppLayout";
import { AdminCoursesPage } from "../pages/admin/AdminCoursesPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { InstructorAssignmentsPage } from "../pages/instructor/InstructorAssignmentsPage";
import { InstructorCourseBuilderPage } from "../pages/instructor/InstructorCourseBuilderPage";
import { InstructorCourseDetailPage } from "../pages/instructor/InstructorCourseDetailPage";
import { InstructorCoursesPage } from "../pages/instructor/InstructorCoursesPage";
import { InstructorDashboardPage } from "../pages/instructor/InstructorDashboardPage";
import { InstructorSubmissionsPage } from "../pages/instructor/InstructorSubmissionsPage";
import { LoginPage } from "../pages/public/LoginPage";
import { RegisterPage } from "../pages/public/RegisterPage";
import { StudentAssignmentsPage } from "../pages/student/StudentAssignmentsPage";
import { StudentCourseDetailPage } from "../pages/student/StudentCourseDetailPage";
import { StudentCoursesPage } from "../pages/student/StudentCoursesPage";
import { StudentDashboardPage } from "../pages/student/StudentDashboardPage";
import { StudentGradesPage } from "../pages/student/StudentGradesPage";
import { SystemHealthPage } from "../pages/system/SystemHealthPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          { path: "admin/dashboard", element: <AdminDashboardPage /> },
          { path: "admin/users", element: <AdminUsersPage /> },
          { path: "admin/courses", element: <AdminCoursesPage /> }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={["instructor"]} />,
        children: [
          { path: "instructor/dashboard", element: <InstructorDashboardPage /> },
          { path: "instructor/courses", element: <InstructorCoursesPage /> },
          { path: "instructor/courses/:id", element: <InstructorCourseDetailPage /> },
          { path: "instructor/courses/:id/builder", element: <InstructorCourseBuilderPage /> },
          { path: "instructor/assignments", element: <InstructorAssignmentsPage /> },
          { path: "instructor/submissions", element: <InstructorSubmissionsPage /> }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={["student"]} />,
        children: [
          { path: "student/dashboard", element: <StudentDashboardPage /> },
          { path: "student/courses", element: <StudentCoursesPage /> },
          { path: "student/courses/:id", element: <StudentCourseDetailPage /> },
          { path: "student/assignments", element: <StudentAssignmentsPage /> },
          { path: "student/grades", element: <StudentGradesPage /> }
        ]
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: "system-health", element: <SystemHealthPage /> }]
      }
    ]
  }
]);
