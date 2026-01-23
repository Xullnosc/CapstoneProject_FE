import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="flex justify-center items-center h-screen bg-linear-to-br from-orange-50 via-white to-green-50 overflow-hidden relative">
            {/* Reuse blobs for consistency if desired, or just clean background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <Card title="Welcome Dashboard" className="relative z-10 w-11/12 max-w-md text-center shadow-xl border-none">
                <p className="m-0 mb-6 text-gray-600">
                    You have successfully logged in!
                </p>
                <div className="flex flex-col gap-3 justify-center">
                    {/* {userRole === 'HOD' && (
                        <Button label="Quản lý Học kỳ (Semester)" icon="pi pi-calendar" severity="info" onClick={() => navigate('/semesters')} className="w-full" />
                    )} */}
                    <Button label="Logout" icon="pi pi-sign-out" severity="warning" onClick={handleLogout} className="w-full" />
                </div>
            </Card>
        </div>
    );
};

export default Home;
