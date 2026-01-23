import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Homepage from '../pages/Homepage/Homepage';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<MainLayout />}>
                <Route path="/home" element={<Homepage />} />
                <Route path="/dashboard" element={<Home />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;
