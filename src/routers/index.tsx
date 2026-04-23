import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Login from "../pages/Login/Login";
import Homepage from "../pages/Homepage/Homepage";
import MainLayout from "../layouts/MainLayout";
import TeamDetail from "../pages/TeamDetail/TeamDetail";
import TeamCreate from "../pages/TeamCreate/TeamCreate";
import ProtectedRoute from "./ProtectedRoute";
import SemesterDashboardPage from "../pages/Semester/SemesterDashboardPage";
import SemesterDetailPage from "../pages/Semester/SemesterDetailPage";
import ThesisPage from "../pages/Thesis/ThesisPage";
import ProposeThesisPage from "../pages/ProposeThesis/ProposeThesisPage";
import MyThesisPage from "../pages/Thesis/MyThesisPage";
import MentorInvitationsPage from "../pages/Mentor/MentorInvitationsPage";
import MentorTeamsPage from "../pages/Mentor/MentorTeamsPage";
import LecturerManagementPage from "../pages/Lecturer/LecturerManagementPage";
import HodAccountsPage from "../pages/Admin/HodAccountsPage";
import AccessLogsPage from "../pages/Admin/AccessLogsPage";
import ErrorLogsPage from "../pages/Admin/ErrorLogsPage";
import AIStudioLayout from "../pages/Admin/AI/AIStudioLayout";
import AISettingsPage from "../pages/Admin/AI/AISettingsPage";
import AIApiKeysManagerPage from "../pages/Admin/AI/AIApiKeysManagerPage";
import SystemSettingsPage from "../pages/Admin/SystemSettingsPage";
import SystemParametersPage from "../pages/Admin/SystemParametersPage";
import PublishedThesisPage from "../pages/Thesis/PublishedThesisPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import OtherProfilePage from "../pages/Profile/OtherProfilePage";
import MyApplicationsPage from "../pages/Application/MyApplicationsPage";
import ApplicationReviewPage from "../pages/Application/ApplicationReviewPage";
import DiscoveryPage from "../pages/Discovery/DiscoveryPage";
import ChatPage from "../pages/Chat/ChatPage";
import AccessDeniedPage from "../pages/AccessDenied/AccessDeniedPage";

// Lazy load notifications page for code splitting
const NotificationsPage = lazy(
  () => import("../pages/Notifications/NotificationsPage"),
);
const ThesisDetailPage = lazy(() => import("../pages/Thesis/ThesisDetailPage"));

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Semester Management - HOD & Admin */}
      <Route element={<ProtectedRoute allowedRoles={["HOD", "Admin"]} />}>
        <Route element={<MainLayout />}>
          <Route path="/semesters" element={<SemesterDashboardPage />} />
          <Route path="/semesters/semester" element={<SemesterDetailPage />} />
          <Route path="/lecturers" element={<LecturerManagementPage />} />
        </Route>
      </Route>

      {/* Admin-only */}
      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/hod" element={<HodAccountsPage />} />
          <Route path="/admin/access-logs" element={<AccessLogsPage />} />
          <Route path="/admin/error-logs" element={<ErrorLogsPage />} />
          <Route
            path="/admin/system-parameters"
            element={<SystemParametersPage />}
          />
          <Route
            path="/admin/system-settings"
            element={<SystemSettingsPage />}
          />
        </Route>
      </Route>

      {/* Shared Home/Dashboard Route */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["Student", "Lecturer", "HOD", "Admin"]}
          />
        }
      >
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
        </Route>
      </Route>

      {/* Student-only Routes */}
      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route element={<MainLayout />}>
          <Route path="/teams" element={<TeamCreate />} />
        </Route>
      </Route>

      {/* General Routes - Restrict Admin from accessing these */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["Student", "Lecturer", "HOD"]} />
        }
      >
        <Route element={<MainLayout />}>
          <Route path="/teams/team" element={<TeamDetail />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/thesis" element={<ThesisPage />} />
          <Route path="/my-thesis" element={<MyThesisPage />} />
          <Route path="/review-thesis" element={<ThesisPage />} />
          <Route
            path="/thesis/:id"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <i className="pi pi-spin pi-spinner text-4xl text-orange-500 mb-4"></i>
                      <p className="text-gray-500">Loading thesis details...</p>
                    </div>
                  </div>
                }
              >
                <ThesisDetailPage />
              </Suspense>
            }
          />
          <Route path="/propose-thesis" element={<ProposeThesisPage />} />
          <Route
            path="/notifications"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <i className="pi pi-spin pi-spinner text-4xl text-orange-500 mb-4"></i>
                      <p className="text-gray-500">Loading notifications...</p>
                    </div>
                  </div>
                }
              >
                <NotificationsPage />
              </Suspense>
            }
          />
          <Route path="/published-thesis" element={<PublishedThesisPage />} />
          <Route path="/my-applications" element={<MyApplicationsPage />} />
          <Route
            path="/application-review"
            element={<ApplicationReviewPage />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<OtherProfilePage />} />
          <Route path="/ai-settings" element={<AIStudioLayout />}>
            <Route index element={<AISettingsPage />} />
            <Route path="api-keys" element={<AIApiKeysManagerPage />} />
          </Route>
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Route>

      {/* Mentor Routes - Lecturer and HOD only */}
      <Route element={<ProtectedRoute allowedRoles={["Lecturer", "HOD"]} />}>
        <Route element={<MainLayout />}>
          <Route path="/mentor-invitations" element={<MentorInvitationsPage />} />
          <Route path="/teams/my-teams" element={<MentorTeamsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;
