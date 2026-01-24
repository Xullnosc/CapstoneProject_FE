import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Homepage from '../pages/Homepage/Homepage';
import MainLayout from '../layouts/MainLayout';

import TeamDetail from '../pages/TeamDetail/TeamDetail';
import TeamCreate from '../pages/TeamCreate/TeamCreate';
// import ProtectedRoute from '../components/ProtectedRoute';

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<MainLayout />}>
                        <Route path="/" element={<Login />} />
          <Route path="/home" element={<Homepage />} />
          {/* <Route element={<ProtectedRoute />}> */}
            <Route path="/teams" element={<TeamCreate />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
          {/* </Route> */}
          {/* <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
            <Route path="/semesters" element={<SemesterManagement />} />
          </Route> */}
            </Route>
        </Routes>
    );
};

export default AppRouter;
