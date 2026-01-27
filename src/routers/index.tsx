import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Homepage from '../pages/Homepage/Homepage';
import MainLayout from '../layouts/MainLayout';
import TeamDetail from '../pages/TeamDetail/TeamDetail';
import TeamCreate from '../pages/TeamCreate/TeamCreate';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* <Route element={<ProtectedRoute />}> */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/teams" element={<TeamCreate />} />
          <Route path="/teams/team" element={<TeamDetail />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/thesis" element={<div className="p-8 text-center text-gray-500">Thesis List Page (Under Construction)</div>} />
        </Route>
      {/* </Route> */}
    </Routes>
  );
};

export default AppRouter;
