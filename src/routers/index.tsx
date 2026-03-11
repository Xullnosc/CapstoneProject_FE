import { Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Login from '../pages/Login/Login';
import Homepage from '../pages/Homepage/Homepage';
import MainLayout from '../layouts/MainLayout';
import TeamDetail from '../pages/TeamDetail/TeamDetail';
import TeamCreate from '../pages/TeamCreate/TeamCreate';
import ProtectedRoute from './ProtectedRoute';
import SemesterDashboardPage from '../pages/Semester/SemesterDashboardPage';
import SemesterDetailPage from '../pages/Semester/SemesterDetailPage';
import ThesisPage from '../pages/Thesis/ThesisPage';
import ProposeThesisPage from '../pages/ProposeThesis/ProposeThesisPage';
import MyThesisPage from '../pages/Thesis/MyThesisPage';
import ThesisDetailPage from '../pages/Thesis/ThesisDetailPage';
import ReviewerThesisPage from '../pages/Thesis/ReviewerThesisPage';
import MentorInvitationsPage from '../pages/Mentor/MentorInvitationsPage';
import MentorTeamsPage from '../pages/Mentor/MentorTeamsPage';

// Lazy load notifications page for code splitting
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Semester Management - Only Admin/HOD */}
      <Route element={<ProtectedRoute allowedRoles={['Admin', 'HOD']} />}>
        <Route element={<MainLayout />}>
          <Route path="/semesters" element={<SemesterDashboardPage />} />
          <Route path="/semesters/semester" element={<SemesterDetailPage />} />
        </Route>
      </Route>

      {/* General Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/teams" element={<TeamCreate />} />
          <Route path="/teams/team" element={<TeamDetail />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/thesis" element={<ThesisPage />} />
          <Route path="/my-thesis" element={<MyThesisPage />} />
          <Route path="/review-thesis" element={<ReviewerThesisPage />} />
          <Route path="/thesis/:id" element={<ThesisDetailPage />} />
          <Route path="/propose-thesis" element={<ProposeThesisPage />} />
          <Route path="/mentor-invitations" element={<MentorInvitationsPage />} />
          <Route path="/teams/my-teams" element={<MentorTeamsPage />} />
          <Route
            path="/notifications"
            element={
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <i className="pi pi-spin pi-spinner text-4xl text-orange-500 mb-4"></i>
                    <p className="text-gray-500">Loading notifications...</p>
                  </div>
                </div>
              }>
                <NotificationsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;
