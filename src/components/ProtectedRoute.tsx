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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | string[] | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                } else {
                    console.log("🛡️ ProtectedRoute Check:", decoded); // DEBUG LOG
                    setIsAuthenticated(true);
                    // Standardize role to array for easier checking
                    const roles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
                    // Assuming the claim name is 'role' or similar standard claim
                    // Note: You might need to adjust based on how your backend validates/issues claims.
                    // In the provided JwtTokenGenerator, it uses ClaimTypes.Role which often maps to "role" or "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                    // Let's assume standard 'role' or check both.
                    setUserRole(roles);
                }
            } catch (error) {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
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
