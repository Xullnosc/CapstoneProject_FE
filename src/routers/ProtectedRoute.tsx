import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

interface DecodedToken {
    role?: string | string[];
    exp: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    // Helper to get initial state from token
    const getInitialAuth = () => {
        const token = localStorage.getItem('token');
        if (!token) return { isAuth: false, role: null };
        try {
            const decoded: DecodedToken = jwtDecode(token);
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                return { isAuth: false, role: null };
            }
            const roles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
            return { isAuth: true, role: roles };
        } catch {
            localStorage.removeItem('token');
            return { isAuth: false, role: null };
        }
    };

    const [{ isAuthenticated, userRole }, setAuthState] = useState<{
        isAuthenticated: boolean;
        userRole: string | string[] | null;
    }>(() => {
        const initial = getInitialAuth();
        return { isAuthenticated: initial.isAuth, userRole: initial.role };
    });

    // Check on mount and token change if needed, but since it's a one-time check for now,
    // lazy init handles the initial load perfectly without cascading renders.
    useEffect(() => {
        // We can add a listener for storage events if we want to handle token removal in other tabs
        const handleStorageChange = () => {
            const current = getInitialAuth();
            setAuthState({ isAuthenticated: current.isAuth, userRole: current.role });
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (isAuthenticated === null) {
        // Still checking authentication status
        return <div>Loading...</div>; // Or a proper loading spinner
    }

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
