import { Route, Routes } from 'react-router-dom';
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
import MentorInvitationsPage from '../pages/Mentor/MentorInvitationsPage';
import MentorTeamsPage from '../pages/Mentor/MentorTeamsPage';
import LecturerManagementPage from '../pages/Lecturer/LecturerManagementPage';
import HodAccountsPage from '../pages/Admin/HodAccountsPage';
import AccessLogsPage from '../pages/Admin/AccessLogsPage';
import PublishedThesisPage from '../pages/Thesis/PublishedThesisPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Semester Management - Only HOD (Admin removed) */}
      <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
        <Route element={<MainLayout />}>
          <Route path="/semesters" element={<SemesterDashboardPage />} />
          <Route path="/semesters/semester" element={<SemesterDetailPage />} />
          <Route path="/lecturers" element={<LecturerManagementPage />} />
        </Route>
      </Route>

      {/* Admin-only */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/hod" element={<HodAccountsPage />} />
          <Route path="/admin/access-logs" element={<AccessLogsPage />} />
        </Route>
      </Route>

      {/* General Routes - Restrict Admin from accessing these */}
      <Route element={<ProtectedRoute allowedRoles={['Student', 'Lecturer', 'HOD']} />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/teams" element={<TeamCreate />} />
          <Route path="/teams/team" element={<TeamDetail />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/thesis" element={<ThesisPage />} />
          <Route path="/my-thesis" element={<MyThesisPage />} />
          <Route path="/review-thesis" element={<ThesisPage />} />
          <Route path="/thesis/:id" element={<ThesisDetailPage />} />
          <Route path="/propose-thesis" element={<ProposeThesisPage />} />
          <Route path="/mentor-invitations" element={<MentorInvitationsPage />} />
          <Route path="/teams/my-teams" element={<MentorTeamsPage />} />
          <Route path="/published-thesis" element={<PublishedThesisPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;
