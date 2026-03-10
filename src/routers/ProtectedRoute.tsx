import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

interface DecodedToken {
    role?: string | string[];
    exp: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const getAuthFromToken = (token: string | null) => {
        if (!token) return { isAuth: false, role: null as string[] | null, isExpired: true };
        try {
            const decoded: DecodedToken = jwtDecode(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            const roles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
            return { isAuth: !isExpired, role: roles, isExpired };
        } catch {
            return { isAuth: false, role: null, isExpired: true };
        }
    };

    const [{ isAuthenticated, userRole, isChecking }, setAuthState] = useState<{
        isAuthenticated: boolean;
        userRole: string | string[] | null;
        isChecking: boolean;
    }>({ isAuthenticated: false, userRole: null, isChecking: true });

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const token = localStorage.getItem('token');
            const current = getAuthFromToken(token);

            if (current.isAuth && !current.isExpired) {
                if (!cancelled) setAuthState({ isAuthenticated: true, userRole: current.role, isChecking: false });
                return;
            }

            // Token missing/expired -> try refresh once (cookie-based).
            const newToken = await authService.refreshAccessToken();
            const refreshed = getAuthFromToken(newToken);
            if (!cancelled) {
                if (refreshed.isAuth && !refreshed.isExpired) {
                    setAuthState({ isAuthenticated: true, userRole: refreshed.role, isChecking: false });
                } else {
                    localStorage.removeItem('token');
                    setAuthState({ isAuthenticated: false, userRole: null, isChecking: false });
                }
            }
        };

        init();

        const handleStorageChange = () => {
            // If token changes in another tab, re-init (will refresh if needed).
            init();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            cancelled = true;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    if (isChecking) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && userRole) {
        const rolesToCheck = Array.isArray(userRole) ? userRole : [userRole];
        const hasPermission = allowedRoles.some(role => rolesToCheck.includes(role));

        if (!hasPermission) {
            // User is logged in but doesn't have permission
            // Redirect to home or unauthorized page
            return <Navigate to="/home" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
