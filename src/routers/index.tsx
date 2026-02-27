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
          <Route path="/propose-thesis" element={<ProposeThesisPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRouter;
