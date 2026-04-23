import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  nameid?: string;
  sub?: string;
  UserId?: string;
  CampusId?: string;
  [key: string]: unknown;
};

export const jwtUtils = {
  getUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const userId =
        decoded.nameid ||
        decoded.sub ||
        decoded.UserId ||
        (typeof decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] === 'string'
          ? (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string)
          : undefined);

      return userId ? parseInt(userId, 10) : 0;
    } catch {
      return 0;
    }
  },

  getCampusId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 1;
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.CampusId ? parseInt(decoded.CampusId, 10) : 1;
    } catch {
      return 1;
    }
  }
};
